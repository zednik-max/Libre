# vertex-proxy/app.py
# Custom OAuth2 Proxy for GCP Vertex AI Model Garden (MAAS)
# This proxy handles authentication and provides an OpenAI-compatible API for LibreChat

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
import httpx
import json
import time
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

# Model endpoint mappings
# Maps friendly model names to actual Vertex AI MAAS endpoints
MODEL_ENDPOINTS = {
    "deepseek-r1": {
        "url": f"https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-central1/endpoints/openapi/chat/completions",
        "model": "deepseek-ai/deepseek-r1-0528-maas"
    },
    "deepseek-v3": {
        "url": f"https://us-west2-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-west2/endpoints/openapi/chat/completions",
        "model": "deepseek-ai/deepseek-v3.1-maas"
    },
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
    OpenAI-compatible chat completions endpoint
    Handles both streaming and non-streaming requests
    """
    try:
        body = await request.json()
        model_id = body.get("model")

        if model_id not in MODEL_ENDPOINTS:
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")

        endpoint = MODEL_ENDPOINTS[model_id]

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

        try:
            if stream:
                # Streaming response
                async def generate():
                    try:
                        async with client.stream(
                            "POST",
                            endpoint["url"],
                            json=body,
                            headers=headers
                        ) as response:
                            if response.status_code != 200:
                                error_text = await response.aread()
                                print(f"Error from Vertex AI: {response.status_code} - {error_text.decode()}")
                                yield f"data: {json.dumps({'error': error_text.decode()})}\n\n"
                                return

                            async for chunk in response.aiter_bytes():
                                yield chunk
                    except Exception as e:
                        print(f"Streaming error: {e}")
                        yield f"data: {json.dumps({'error': str(e)})}\n\n"
                    finally:
                        await client.aclose()

                return StreamingResponse(generate(), media_type="text/event-stream")
            else:
                # Non-streaming response
                response = await client.post(
                    endpoint["url"],
                    json=body,
                    headers=headers
                )

                await client.aclose()

                if response.status_code != 200:
                    print(f"Error from Vertex AI: {response.status_code} - {response.text}")
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=response.text
                    )

                return JSONResponse(content=response.json())
        except HTTPException:
            await client.aclose()
            raise
        except Exception as e:
            await client.aclose()
            print(f"Request error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    except HTTPException:
        raise
    except Exception as e:
        print(f"Handler error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4000, log_level="info")
