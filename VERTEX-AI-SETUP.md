# Vertex AI Setup & Troubleshooting Guide

## Issue: 403 Permission Denied Error

If you see this error:
```
Error from Vertex AI: 403 - Permission 'aiplatform.endpoints.predict' denied
```

This means your GCP service account doesn't have the required permissions to access Vertex AI Model Garden endpoints.

## Quick Fix

### 1. **Verify Service Account**
Your service account from `gcp-sa-key.json`:
- **Email**: `vertex-ai-sa@vertex--project-durovcik.iam.gserviceaccount.com`
- **Project**: `vertex--project-durovcik`

### 2. **Grant Required IAM Roles**

Open Google Cloud Console and run these commands in Cloud Shell:

```bash
# Set your project ID
PROJECT_ID="vertex--project-durovcik"
SERVICE_ACCOUNT="vertex-ai-sa@vertex--project-durovcik.iam.gserviceaccount.com"

# Grant Vertex AI User role (required for endpoints.predict)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/aiplatform.user"

# Grant Vertex AI Service Agent role (for model access)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/aiplatform.serviceAgent"

# Optional: For Storage (if using DeepSeek OCR)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/storage.objectAdmin"
```

**OR** Use the Web Console:

1. Go to: https://console.cloud.google.com/iam-admin/iam?project=vertex--project-durovcik
2. Find your service account: `vertex-ai-sa@vertex--project-durovcik.iam.gserviceaccount.com`
3. Click "Edit Principal" (pencil icon)
4. Click "Add Another Role" and add:
   - **Vertex AI User** (`roles/aiplatform.user`) - Required
   - **Vertex AI Service Agent** (`roles/aiplatform.serviceAgent`) - Recommended
   - **Storage Object Admin** (`roles/storage.objectAdmin`) - Optional (for OCR)
5. Click "Save"

### 3. **Verify Permissions**

```bash
# Check what roles the service account has
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:$SERVICE_ACCOUNT"
```

### 4. **Rebuild Vertex Proxy**

After granting permissions, rebuild the proxy to use the updated credentials:

```powershell
# Using LibreChatManager
.\LibreChatManager.ps1 -Action 7

# OR manually
docker-compose -f docker-compose.windows.yml stop vertex-proxy
docker-compose -f docker-compose.windows.yml build --no-cache vertex-proxy
docker-compose -f docker-compose.windows.yml up -d vertex-proxy
```

### 5. **Test the Connection**

```powershell
# Using LibreChatManager
.\LibreChatManager.ps1 -Action 14

# OR manually
curl -X POST http://localhost:4000/v1/chat/completions `
  -H "Content-Type: application/json" `
  -d '{
    "model": "deepseek-v3",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": false
  }'
```

## Required IAM Roles Explained

| Role | Purpose | Required? |
|------|---------|-----------|
| `roles/aiplatform.user` | Access to Vertex AI endpoints (predict) | ✅ **YES** |
| `roles/aiplatform.serviceAgent` | Full service agent access | ⚠️ Recommended |
| `roles/storage.objectAdmin` | Upload images for OCR | 🔶 Optional |

## Minimum Required Permissions

If you want to use custom roles instead of predefined roles:

```yaml
- aiplatform.endpoints.predict      # Make predictions
- aiplatform.endpoints.get          # Get endpoint details
- aiplatform.models.get             # Get model details
```

## Troubleshooting

### Check Logs
```powershell
docker logs vertex-proxy --tail 50
```

### Common Issues

1. **Wrong Project ID**
   - **Fixed**: The proxy now auto-detects project ID from `gcp-sa-key.json`
   - Verify: Look for `Using GCP Project: vertex--project-durovcik` in logs

2. **403 Permission Denied**
   - Cause: Missing IAM roles
   - Fix: Grant `roles/aiplatform.user` as shown above

3. **401 Unauthorized**
   - Cause: Invalid or expired service account key
   - Fix: Download a new key from GCP Console

4. **404 Not Found**
   - Cause: Model or endpoint doesn't exist in your region
   - Fix: Check available models in your project

### Verify Service Account Key

```powershell
# Check the project ID in your key file
Get-Content "D:\java\LibreChat\gcp-sa-key.json" | ConvertFrom-Json | Select-Object project_id, client_email
```

Should show:
```
project_id               client_email
----------               ------------
vertex--project-durovcik vertex-ai-sa@vertex--project-durovcik.iam.gserviceaccount.com
```

## Additional Resources

- [Vertex AI IAM Roles](https://cloud.google.com/vertex-ai/docs/general/access-control)
- [Service Account Keys](https://cloud.google.com/iam/docs/keys-create-delete)
- [Vertex AI Model Garden](https://cloud.google.com/vertex-ai/generative-ai/docs/model-garden/explore-models)

## Need Help?

1. Check logs: `docker logs vertex-proxy`
2. Test health: `curl http://localhost:4000/health`
3. Verify container: `docker ps | grep vertex-proxy`

---

*Last Updated: 2025-12-10*
