#!/bin/bash
# Test DeepSeek OCR with the console.png from GCS

# Get OAuth token (assuming service account is available)
ACCESS_TOKEN=$(gcloud auth application-default print-access-token)

# Vertex AI endpoint for DeepSeek OCR
URL="https://aiplatform.googleapis.com/v1/projects/vertex-ai-project-skorec/locations/global/endpoints/openapi/chat/completions"

# Request with your console.png GCS URL
curl -X POST "$URL" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-ai/deepseek-ocr-maas",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "image_url",
            "image_url": "gs://vertex-ocr-temp-vertex-ai-project-skorec/console.png"
          }
        ]
      }
    ]
  }' | jq -r '.choices[0].message.content'
