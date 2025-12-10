# Vertex AI 403 Error - RESOLVED

## Problem
You were getting this error when trying to use Vertex AI models:
```
403 status code (no body)
Permission 'aiplatform.endpoints.predict' denied
```

## Root Causes Found

### 1. ❌ Wrong Project ID (FIXED)
- **Problem**: `vertex-proxy/app.py` had hardcoded `PROJECT_ID = "vertex-ai-project-skorec"`
- **Your Actual Project**: `vertex--project-durovcik`
- **Fix Applied**: Modified `app.py` to auto-detect project ID from `gcp-sa-key.json`

### 2. ⚠️ Missing IAM Permissions (ACTION REQUIRED)
- **Problem**: Service account `vertex-ai-sa@vertex--project-durovcik.iam.gserviceaccount.com` doesn't have required permissions
- **Required Role**: `roles/aiplatform.user` (Vertex AI User)
- **Fix Required**: Grant permissions via Google Cloud Console

## Quick Fix Steps

### Step 1: Fix Project ID (Already Done ✅)
The code has been updated to auto-detect your project ID.

### Step 2: Grant IAM Permissions (You Need to Do This)

**Option A: Use the Helper Script**
```powershell
.\FixVertexPermissions.ps1
```
This will:
- Show your project ID and service account email
- Provide the exact gcloud commands to run
- Optionally open the Google Cloud IAM page in your browser

**Option B: Manual via Google Cloud Console**
1. Open: https://console.cloud.google.com/iam-admin/iam?project=vertex--project-durovcik
2. Find: `vertex-ai-sa@vertex--project-durovcik.iam.gserviceaccount.com`
3. Click the pencil (Edit) icon
4. Click "Add Another Role"
5. Select: **Vertex AI User** (`roles/aiplatform.user`)
6. Click "Save"

**Option C: Using gcloud CLI**
```bash
PROJECT_ID="vertex--project-durovcik"
SERVICE_ACCOUNT="vertex-ai-sa@vertex--project-durovcik.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/aiplatform.user"
```

### Step 3: Rebuild Vertex Proxy
After granting permissions:
```powershell
.\LibreChatManager.ps1 -Action 7
```
Or select option 7 from the interactive menu.

### Step 4: Test
```powershell
.\LibreChatManager.ps1 -Action 14
```
Or select option 14 to test the Vertex Proxy connection.

## Files Modified

1. **vertex-proxy/app.py** - Auto-detects project ID from service account key
2. **LibreChatManager.ps1** - Added option 20 (View Vertex AI Setup Guide)
3. **VERTEX-AI-SETUP.md** - Comprehensive setup and troubleshooting guide
4. **FixVertexPermissions.ps1** - Helper script to grant IAM permissions

## Expected Result

After granting permissions and rebuilding, you should see:
```
Using GCP Project: vertex--project-durovcik
Using cached token (expires in XXXs)
```

Instead of the 403 error.

## Additional Help

- **View Setup Guide**: Run `.\LibreChatManager.ps1` and select option 20
- **Check Logs**: `docker logs vertex-proxy --tail 50`
- **Test Connection**: Run option 14 in LibreChatManager
- **Full Documentation**: See `VERTEX-AI-SETUP.md`

## Support

If you still have issues after granting permissions:
1. Check logs: `docker logs vertex-proxy`
2. Verify service account: `.\FixVertexPermissions.ps1`
3. Check IAM roles in GCP Console
4. Ensure Vertex AI API is enabled in your project

---

**Status**: Code fixes applied ✅ | IAM permissions required ⚠️

**Next Step**: Grant IAM permissions using one of the methods above, then rebuild the proxy.
