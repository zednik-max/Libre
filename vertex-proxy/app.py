# vertex-proxy/app.py
# Custom OAuth2 Proxy for GCP Vertex AI Model Garden (MAAS)
# This proxy handles authentication and provides an OpenAI-compatible API for LibreChat

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
import httpx
import json
import time
import random
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

        for attempt_num, current_endpoint in enumerate(endpoints_to_try):
            try:
                # Update URL and model for current endpoint
                current_url = current_endpoint["url"]
                body["model"] = current_endpoint["model"]
                region = current_endpoint.get("region", "unknown")

                if attempt_num > 0:
                    print(f"Failover attempt {attempt_num}: trying region {region}")

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

                        # Try next endpoint if available
                        if attempt_num < len(endpoints_to_try) - 1:
                            continue

                        # No more endpoints to try
                        await client.aclose()
                        raise HTTPException(
                            status_code=response.status_code,
                            detail=response.text
                        )

                    # Success!
                    await client.aclose()
                    return JSONResponse(content=response.json())

            except HTTPException:
                await client.aclose()
                raise
            except Exception as e:
                error_msg = f"Request error ({region}): {e}"
                print(error_msg)
                last_error = error_msg

                # Try next endpoint if available
                if attempt_num < len(endpoints_to_try) - 1:
                    continue

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
