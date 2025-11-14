# Vertex AI Custom Icon Guide

## Quick Solution (Already Applied)

I've updated `librechat.vertex-ai.yaml` to use the existing Google icon:

```yaml
iconURL: '/assets/google.svg'
```

This will display the Google logo next to "GCP Vertex AI" in your model selector.

## How to Test

1. **Copy the updated configuration** to your local LibreChat directory:
   ```bash
   # On your Windows machine
   copy librechat.vertex-ai.yaml librechat.yaml
   ```

2. **Restart LibreChat**:
   ```powershell
   docker-compose -f docker-compose.windows.yml restart
   ```

3. **Check the model selector** - You should see the Google icon next to "GCP Vertex AI"

## Option 1: Use Existing Icons (Recommended)

LibreChat already includes several icons in `client/public/assets/`. You can use any of these:

```yaml
iconURL: '/assets/google.svg'        # Google logo (current)
iconURL: '/assets/google-palm.svg'   # Google PaLM icon
iconURL: '/assets/deepseek.svg'      # DeepSeek icon (if you primarily use DeepSeek models)
iconURL: '/assets/openai.svg'        # OpenAI icon
```

## Option 2: Add Custom Vertex AI Icon

If you want a specific Vertex AI logo:

### Step 1: Download Vertex AI Icon

Find a Vertex AI or Google Cloud icon:
- **Official GCP Icons**: https://cloud.google.com/icons
- **Vertex AI Logo**: Search for "Vertex AI logo PNG" or "Vertex AI SVG"
- **Recommended**: Use SVG format for best quality

### Step 2: Add Icon to LibreChat

1. **Save the icon** as `vertex-ai.svg` or `vertex-ai.png`

2. **Copy to assets directory** (in your local LibreChat clone):
   ```bash
   # Place the icon in:
   client/public/assets/vertex-ai.svg
   ```

3. **Update configuration**:
   ```yaml
   iconURL: '/assets/vertex-ai.svg'
   ```

### Step 3: Rebuild Frontend (if using local build)

If you're building LibreChat locally (not using Docker image):

```bash
cd client
npm run build
```

For Docker deployments, the icon will be included automatically when you restart.

## Option 3: Use Remote URL

You can use any publicly accessible image URL:

```yaml
iconURL: 'https://www.gstatic.com/lamda/images/favicon_v1_150160cddff7f294ce30.svg'  # Google AI icon
```

Or use the official Vertex AI icon from GCP:

```yaml
iconURL: 'https://cloud.google.com/static/images/cloud-marketplace/products/vertex-ai.svg'
```

### Pros and Cons

**Local files** (`/assets/...`):
- ✅ Faster loading
- ✅ Works offline
- ✅ No external dependencies
- ❌ Requires file to be in assets directory

**Remote URLs** (`https://...`):
- ✅ No need to add files
- ✅ Easy to update
- ❌ Requires internet connection
- ❌ Dependent on external service

## Complete Configuration Example

Here's your updated `librechat.yaml` with the icon:

```yaml
version: 1.2.1

endpoints:
  custom:
    - name: 'Vertex-AI'
      apiKey: 'dummy'
      baseURL: 'http://vertex-proxy:4000'
      iconURL: '/assets/google.svg'  # 👈 Icon configuration

      models:
        default:
          - 'deepseek-r1'
          - 'deepseek-v3'
          - 'minimax-m2'
          - 'qwen3-235b'
          - 'llama-3.3-70b'
          - 'qwen3-thinking'
          - 'llama-4-maverick'
          - 'llama-4-scout'
        fetch: false

      titleConvo: true
      titleModel: 'deepseek-v3'
      modelDisplayLabel: 'GCP Vertex AI'
      dropParams: []
```

## Troubleshooting

### Icon Not Showing

1. **Clear browser cache**: Ctrl+F5 or Ctrl+Shift+R
2. **Check icon path**: Ensure the file exists at `client/public/assets/your-icon.svg`
3. **Check browser console**: Open DevTools (F12) and look for 404 errors
4. **Restart LibreChat**: `docker-compose restart`

### Icon Showing as Broken Image

1. **Verify icon format**: Use SVG or PNG
2. **Check file permissions**: Ensure the file is readable
3. **Try different path**: Switch between `/assets/icon.svg` and `https://...` to test

### Icon Too Large/Small

The icon size is controlled by LibreChat's CSS. You don't need to resize the image - the UI will handle it automatically.

## Custom Icon Recommendations

For best results:
- **Format**: SVG (scalable, crisp at any size)
- **Size**: Any size (SVG scales), but 100x100px to 500x500px for PNG
- **Colors**: Simple, recognizable logo
- **Background**: Transparent (PNG/SVG with transparency)

## Where the Icon Appears

The icon will be displayed in:
1. **Model Selector Menu** (top of chat interface) - Most prominent
2. **Conversation History** (sidebar)
3. **Message Headers** (in chat)
4. **Preset Selection**

## Quick Reference: Icon URL Formats

```yaml
# Local file (recommended)
iconURL: '/assets/vertex-ai.svg'

# Remote URL
iconURL: 'https://example.com/icon.svg'

# Existing LibreChat icons
iconURL: '/assets/google.svg'
iconURL: '/assets/google-palm.svg'
iconURL: '/assets/deepseek.svg'
iconURL: '/assets/mistral.png'
iconURL: '/assets/perplexity.png'
```

## Next Steps

1. ✅ Icon configuration added to `librechat.vertex-ai.yaml`
2. Copy the file to your local LibreChat directory as `librechat.yaml`
3. Restart LibreChat
4. Verify the icon appears in the model selector

If you want to use a different icon, just update the `iconURL` field and restart!
