# vertex-proxy/app.py
# Custom OAuth2 Proxy for GCP Vertex AI Model Garden (MAAS)
# This proxy handles authentication and provides an OpenAI-compatible API for LibreChat

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
import httpx
import json
import time
import random
import asyncio
from google.oauth2 import service_account
from google.auth.transport.requests import Request as GoogleRequest
import os

app = FastAPI()

# Load service account credentials
SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "/app/gcp-sa-key.json")
PROJECT_ID = "vertex-ai-project-skorec"

# Token caching - reduces auth latency by 50-100ms per request
# Tokens are valid for 1 hour, we refresh at 55 minutes to be safe
token_cache = {
    "token": None,
    "expires_at": 0
}

# Retry configuration with exponential backoff
# This prevents overwhelming failing endpoints and gives them time to recover
RETRY_CONFIG = {
    "max_retries": 3,          # Maximum number of retry attempts (0 = no retries)
    "base_delay": 2,           # Base delay in seconds for first retry
    "multiplier": 2.5,         # Exponential multiplier (2.5 gives: 2s, 5s, 12.5s, 31.25s)
    "max_delay": 60,           # Maximum delay cap in seconds
    "jitter": True,            # Add random jitter (±20%) to prevent thundering herd
    "jitter_factor": 0.2       # Jitter range: ±20% of calculated delay
}

def calculate_retry_delay(attempt: int) -> float:
    """
    Calculate exponential backoff delay with optional jitter

    Formula: delay = min(base_delay * (multiplier^attempt), max_delay)
    With jitter: delay ± (delay * jitter_factor)

    Args:
        attempt: Current retry attempt number (0-indexed)

    Returns:
        Delay in seconds (float)

    Examples:
        - Attempt 0: 2.0s
        - Attempt 1: 5.0s (2 * 2.5^1)
        - Attempt 2: 12.5s (2 * 2.5^2)
        - Attempt 3: 31.25s (2 * 2.5^3)
    """
    base = RETRY_CONFIG["base_delay"]
    multiplier = RETRY_CONFIG["multiplier"]
    max_delay = RETRY_CONFIG["max_delay"]

    # Calculate exponential delay
    delay = base * (multiplier ** attempt)

    # Apply maximum delay cap
    delay = min(delay, max_delay)

    # Add jitter if enabled (prevents synchronized retries)
    if RETRY_CONFIG["jitter"]:
        jitter_range = delay * RETRY_CONFIG["jitter_factor"]
        jitter = random.uniform(-jitter_range, jitter_range)
        delay = max(0.1, delay + jitter)  # Ensure delay is at least 0.1s

    return delay

# Model endpoint mappings with pooling support
# Models can have single endpoint (dict) or multiple endpoints (list) for load balancing
# Multiple endpoints provide better availability and automatic failover
MODEL_ENDPOINTS = {
    # Single endpoint (backward compatible)
    "deepseek-r1": {
        "url": f"https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-central1/endpoints/openapi/chat/completions",
        "model": "deepseek-ai/deepseek-r1-0528-maas"
    },

    # Multiple endpoints with weighted load balancing (example)
    "deepseek-v3": [
        {
            "url": f"https://us-west2-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-west2/endpoints/openapi/chat/completions",
            "model": "deepseek-ai/deepseek-v3.1-maas",
            "region": "us-west2",
            "weight": 70  # Primary endpoint gets 70% of traffic
        },
        {
            "url": f"https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-central1/endpoints/openapi/chat/completions",
            "model": "deepseek-ai/deepseek-v3.1-maas",
            "region": "us-central1",
            "weight": 30  # Secondary endpoint gets 30% of traffic
        }
    ],

    "minimax-m2": {
        "url": f"https://aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/global/endpoints/openapi/chat/completions",
        "model": "minimaxai/minimax-m2-maas"
    },
    "qwen3-235b": {
        "url": f"https://us-south1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-south1/endpoints/openapi/chat/completions",
        "model": "qwen/qwen3-235b-a22b-instruct-2507-maas"
    },
    "llama-3.3-70b": {
        "url": f"https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-central1/endpoints/openapi/chat/completions",
        "model": "meta/llama-3.3-70b-instruct-maas"
    },
    "qwen3-thinking": {
        "url": f"https://aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/global/endpoints/openapi/chat/completions",
        "model": "qwen/qwen3-next-80b-a3b-thinking-maas"
    },
    "llama-4-maverick": {
        "url": f"https://us-east5-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-east5/endpoints/openapi/chat/completions",
        "model": "meta/llama-4-maverick-17b-128e-instruct-maas"
    },
    "llama-4-scout": {
        "url": f"https://us-east5-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-east5/endpoints/openapi/chat/completions",
        "model": "meta/llama-4-scout-17b-16e-instruct-maas"
    },
    "deepseek-ocr": {
        "url": f"https://aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/global/endpoints/openapi/chat/completions",
        "model": "deepseek-ai/deepseek-ocr-maas"
    }
}

def get_access_token():
    """
    Generate OAuth2 access token from service account with caching
    This token is used for authenticating with GCP Vertex AI

    Tokens are cached for 55 minutes (GCP tokens expire after 1 hour)
    This reduces auth latency by 50-100ms per request
    """
    try:
        # Check if we have a valid cached token
        current_time = time.time()
        if token_cache["token"] and current_time < token_cache["expires_at"]:
            print(f"Using cached token (expires in {int(token_cache['expires_at'] - current_time)}s)")
            return token_cache["token"]

        # Generate new token
        print("Generating new OAuth2 token...")
        credentials = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE,
            scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
        credentials.refresh(GoogleRequest())

        # Cache the token for 55 minutes (3300 seconds)
        token_cache["token"] = credentials.token
        token_cache["expires_at"] = current_time + 3300

        print(f"New token generated, valid for 55 minutes")
        return credentials.token
    except Exception as e:
        print(f"Error getting access token: {e}")
        raise

def select_endpoint(model_id):
    """
    Select an endpoint from the pool using weighted random selection
    Supports both single endpoints (dict) and multiple endpoints (list) for load balancing

    Returns: (endpoint_dict, is_pooled)
    """
    endpoints = MODEL_ENDPOINTS.get(model_id)

    if not endpoints:
        return None, False

    # Single endpoint (backward compatible)
    if isinstance(endpoints, dict):
        return endpoints, False

    # Multiple endpoints - use weighted random selection
    if isinstance(endpoints, list):
        total_weight = sum(ep.get("weight", 1) for ep in endpoints)
        random_value = random.uniform(0, total_weight)

        current_weight = 0
        for endpoint in endpoints:
            current_weight += endpoint.get("weight", 1)
            if random_value <= current_weight:
                region = endpoint.get("region", "unknown")
                print(f"Selected endpoint in region: {region}")
                return endpoint, True

        # Fallback to first endpoint (shouldn't reach here)
        return endpoints[0], True

    return None, False

def transform_deepseek_ocr_images(body):
    """
    Transform OpenAI image format to DeepSeek OCR format

    DeepSeek OCR on Vertex AI expects ONLY images, no text prompts.
    This function:
    1. Transforms image format from OpenAI to DeepSeek
    2. REMOVES all text content (DeepSeek OCR doesn't use prompts)

    Input (OpenAI format from LibreChat):
        content: [
            {type: "text", text: "extract text"},
            {type: "image_url", image_url: {url: "data:image/jpeg;base64,..."}}
        ]

    Output (DeepSeek OCR format):
        content: [{
            type: "image_url",
            image_url: "data:image/jpeg;base64,..."
        }]

    Args:
        body: Request body dict containing messages

    Returns:
        Modified body dict with transformed image format and no text

    Raises:
        ValueError: If image URL format is unsupported
    """
    messages = body.get("messages", [])
    images_transformed = 0
    text_removed = 0

    for message in messages:
        content = message.get("content")

        # Skip if content is string (text-only message)
        if not isinstance(content, list):
            continue

        # Filter content: keep only images, remove text
        new_content = []

        for item in content:
            if item.get("type") == "text":
                # Remove text content - DeepSeek OCR doesn't use prompts
                text_removed += 1
                print(f"DeepSeek OCR: Removed text prompt: '{item.get('text', '')[:50]}...'")
                continue

            if item.get("type") == "image_url":
                image_url_obj = item.get("image_url")

                # OpenAI format: {"url": "data:...", "detail": "..."}
                if isinstance(image_url_obj, dict):
                    url = image_url_obj.get("url", "")

                    if not url:
                        raise ValueError("Image URL is empty")

                    # Check image size estimate (base64 size * 0.75 ≈ binary size)
                    if url.startswith("data:image/"):
                        # Extract base64 data (after comma)
                        try:
                            base64_data = url.split(",", 1)[1] if "," in url else url
                            estimated_size_mb = len(base64_data) * 0.75 / (1024 * 1024)

                            if estimated_size_mb > 20:
                                raise ValueError(f"Image too large: {estimated_size_mb:.1f}MB (max 20MB)")

                            print(f"DeepSeek OCR: Transforming base64 image (~{estimated_size_mb:.2f}MB)")
                        except Exception as e:
                            print(f"Warning: Could not estimate image size: {e}")

                    # Transform to DeepSeek format (just the URL string)
                    if url.startswith("data:image/"):
                        # Base64 data URL - try sending JUST the base64 data without prefix
                        # DeepSeek OCR might expect raw base64, not data URI format
                        try:
                            # Extract just the base64 part after "base64,"
                            if ",base64," in url or ";base64," in url:
                                base64_only = url.split("base64,", 1)[1]
                                print(f"DeepSeek OCR: Extracted raw base64 data (length: {len(base64_only)})")
                                item["image_url"] = base64_only
                            else:
                                # Fallback: send full data URI if no base64 marker found
                                print(f"DeepSeek OCR: Sending full data URI (no base64 marker found)")
                                item["image_url"] = url
                        except Exception as e:
                            print(f"Warning: Could not extract base64: {e}, sending full URL")
                            item["image_url"] = url
                        images_transformed += 1
                    elif url.startswith("gs://"):
                        # GCS URL - pass directly
                        item["image_url"] = url
                        images_transformed += 1
                        print(f"DeepSeek OCR: Using GCS URL: {url[:50]}...")
                    elif url.startswith("http://") or url.startswith("https://"):
                        # HTTP URL - pass directly
                        item["image_url"] = url
                        images_transformed += 1
                        print(f"DeepSeek OCR: Using HTTP URL: {url[:50]}...")
                    else:
                        raise ValueError(f"Unsupported image URL format: {url[:50]}...")

                # Already in correct format (string) - no transformation needed
                elif isinstance(image_url_obj, str):
                    print(f"DeepSeek OCR: Image already in correct format")

                new_content.append(item)

        # Replace content with filtered version (images only, no text)
        message["content"] = new_content

    if images_transformed > 0:
        print(f"DeepSeek OCR: Transformed {images_transformed} image(s) from OpenAI to DeepSeek format")
    if text_removed > 0:
        print(f"DeepSeek OCR: Removed {text_removed} text prompt(s) (OCR doesn't use prompts)")

    return body

@app.get("/health")
async def health():
    """Health check endpoint - returns available models"""
    return {"status": "healthy", "models": list(MODEL_ENDPOINTS.keys())}

@app.get("/token-status")
async def token_status():
    """Check OAuth2 token cache status"""
    current_time = time.time()
    if token_cache["token"] and current_time < token_cache["expires_at"]:
        time_remaining = int(token_cache["expires_at"] - current_time)
        return {
            "cached": True,
            "expires_in_seconds": time_remaining,
            "expires_in_minutes": round(time_remaining / 60, 1)
        }
    else:
        return {
            "cached": False,
            "message": "No cached token or token expired"
        }

@app.get("/retry-config")
async def retry_config():
    """Get current retry configuration with exponential backoff details"""
    # Calculate example delays
    example_delays = [
        {
            "attempt": i,
            "delay_seconds": round(calculate_retry_delay(i), 2),
            "description": "First retry" if i == 0 else f"Retry {i + 1}"
        }
        for i in range(RETRY_CONFIG["max_retries"])
    ]

    return {
        "config": RETRY_CONFIG,
        "example_delays": example_delays,
        "formula": f"delay = min({RETRY_CONFIG['base_delay']} * ({RETRY_CONFIG['multiplier']}^attempt), {RETRY_CONFIG['max_delay']})",
        "jitter_info": f"±{int(RETRY_CONFIG['jitter_factor'] * 100)}% random variation" if RETRY_CONFIG["jitter"] else "Disabled"
    }

@app.get("/v1/models")
async def list_models():
    """OpenAI-compatible models endpoint"""
    return {
        "object": "list",
        "data": [
            {"id": model_id, "object": "model", "owned_by": "vertex-ai"}
            for model_id in MODEL_ENDPOINTS.keys()
        ]
    }

@app.post("/v1/chat/completions")
@app.post("/chat/completions")
async def chat_completions(request: Request):
    """
    OpenAI-compatible chat completions endpoint with model pooling
    Handles both streaming and non-streaming requests
    Supports automatic failover between multiple endpoints
    """
    try:
        body = await request.json()
        model_id = body.get("model")

        if model_id not in MODEL_ENDPOINTS:
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")

        # Transform images for DeepSeek OCR (converts OpenAI format to DeepSeek format)
        if model_id == "deepseek-ocr":
            try:
                # Log the BEFORE state
                import json as json_lib
                print("=" * 80)
                print("DeepSeek OCR: REQUEST BEFORE TRANSFORMATION")
                print(json_lib.dumps(body.get("messages", []), indent=2, ensure_ascii=False)[:2000])
                print("=" * 80)

                body = transform_deepseek_ocr_images(body)

                # Log the AFTER state
                print("=" * 80)
                print("DeepSeek OCR: REQUEST AFTER TRANSFORMATION")
                print(json_lib.dumps(body.get("messages", []), indent=2, ensure_ascii=False)[:2000])
                print("=" * 80)
            except ValueError as e:
                raise HTTPException(status_code=400, detail=f"Image transformation error: {str(e)}")
            except Exception as e:
                print(f"Unexpected error in image transformation: {e}")
                raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")

        # Select endpoint (with load balancing if multiple endpoints available)
        endpoint, is_pooled = select_endpoint(model_id)

        if not endpoint:
            raise HTTPException(status_code=500, detail=f"No endpoints available for model {model_id}")

        # Replace model name with actual Vertex AI model ID
        body["model"] = endpoint["model"]

        # Get OAuth2 token
        access_token = get_access_token()

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        # Check if streaming is requested
        stream = body.get("stream", False)

        # Create persistent client
        client = httpx.AsyncClient(timeout=600.0)

        # For pooled models, implement failover logic
        endpoints_to_try = []
        if is_pooled:
            # Try selected endpoint first, then all others if it fails
            all_endpoints = MODEL_ENDPOINTS[model_id]
            endpoints_to_try = [endpoint] + [ep for ep in all_endpoints if ep != endpoint]
        else:
            endpoints_to_try = [endpoint]

        last_error = None
        retry_count = 0

        for endpoint_num, current_endpoint in enumerate(endpoints_to_try):
            # Each endpoint gets max_retries + 1 attempts (initial + retries)
            max_attempts = RETRY_CONFIG["max_retries"] + 1

            for retry_attempt in range(max_attempts):
                try:
                    # Update URL and model for current endpoint
                    current_url = current_endpoint["url"]
                    body["model"] = current_endpoint["model"]
                    region = current_endpoint.get("region", "unknown")

                    # Log attempt information
                    if endpoint_num > 0 and retry_attempt == 0:
                        print(f"Failover to endpoint {endpoint_num + 1}/{len(endpoints_to_try)}: trying region {region}")
                    elif retry_attempt > 0:
                        print(f"Retry attempt {retry_attempt}/{RETRY_CONFIG['max_retries']} for region {region}")

                    # Apply exponential backoff delay before retry (not on first attempt)
                    if retry_attempt > 0:
                        delay = calculate_retry_delay(retry_attempt - 1)
                        print(f"Waiting {delay:.1f}s before retry (exponential backoff)...")
                        await asyncio.sleep(delay)

                    retry_count += 1

                    if stream:
                        # Streaming response
                        async def generate():
                            try:
                                async with client.stream(
                                    "POST",
                                    current_url,
                                    json=body,
                                    headers=headers
                                ) as response:
                                    if response.status_code != 200:
                                        error_text = await response.aread()
                                        print(f"Error from Vertex AI ({region}): {response.status_code} - {error_text.decode()}")
                                        yield f"data: {json.dumps({'error': error_text.decode()})}\n\n"
                                        return

                                    async for chunk in response.aiter_bytes():
                                        yield chunk
                            except Exception as e:
                                print(f"Streaming error ({region}): {e}")
                                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                            finally:
                                await client.aclose()

                        return StreamingResponse(generate(), media_type="text/event-stream")
                    else:
                        # Non-streaming response
                        response = await client.post(
                            current_url,
                            json=body,
                            headers=headers
                        )

                        if response.status_code != 200:
                            error_msg = f"Error from Vertex AI ({region}): {response.status_code} - {response.text}"
                            print(error_msg)
                            last_error = error_msg

                            # Try next retry attempt if available
                            if retry_attempt < RETRY_CONFIG["max_retries"]:
                                continue

                            # Max retries reached for this endpoint, try next endpoint
                            if endpoint_num < len(endpoints_to_try) - 1:
                                break  # Break retry loop, continue to next endpoint

                            # No more endpoints to try
                            await client.aclose()
                            raise HTTPException(
                                status_code=response.status_code,
                                detail=response.text
                            )

                        # Success!
                        await client.aclose()
                        print(f"Request succeeded after {retry_count} total attempt(s)")
                        return JSONResponse(content=response.json())

                except HTTPException:
                    await client.aclose()
                    raise
                except Exception as e:
                    error_msg = f"Request error ({region}): {e}"
                    print(error_msg)
                    last_error = error_msg

                    # Try next retry attempt if available
                    if retry_attempt < RETRY_CONFIG["max_retries"]:
                        continue

                    # Max retries reached for this endpoint, try next endpoint
                    if endpoint_num < len(endpoints_to_try) - 1:
                        break  # Break retry loop, continue to next endpoint

                    # No more endpoints to try
                    await client.aclose()
                    raise HTTPException(status_code=500, detail=str(e))

        # Should not reach here, but just in case
        await client.aclose()
        raise HTTPException(status_code=500, detail=last_error or "All endpoints failed")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Handler error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4000, log_level="info")
