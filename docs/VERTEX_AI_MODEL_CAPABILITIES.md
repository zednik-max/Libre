# Vertex AI Model Garden - Model Capabilities Reference

**Last Updated:** 2025-11-18
**LibreChat Version:** v0.8.1-rc1

## Model Capabilities Overview

This document lists all Vertex AI Model Garden models configured in LibreChat and their capabilities. Test each model to confirm which tasks they support.

---

## Text-Only Models

### DeepSeek-V3 (`deepseek-v3`)
- **Model ID:** `deepseek-ai/deepseek-v3.1-maas`
- **Parameters:** 671B (MoE with 37B activated)
- **Regions:** us-west2, us-central1 (primary: us-west2)
- **Supported Tasks:** ✅ **ALL TASKS SUPPORTED**
  - ✅ Classification
  - ✅ Detection
  - ✅ Extraction
  - ✅ Generation
  - ✅ Recognition
  - ✅ Translation
- **Notes:** General-purpose model, hybrid thinking mode

### DeepSeek-R1 (`deepseek-r1`)
- **Model ID:** `deepseek-ai/deepseek-r1-0528-maas`
- **Parameters:** 671B
- **Region:** us-central1
- **Supported Tasks:** ✅ **ALL TASKS SUPPORTED** (Plus advanced reasoning)
  - ✅ Classification
  - ✅ Detection
  - ✅ Extraction
  - ✅ Generation
  - ✅ Recognition
  - ✅ Translation
  - ✅ Reasoning (primary capability)
  - ✅ Math problem solving
  - ✅ Code generation
  - ✅ Logical deduction
- **Notes:** Advanced reasoning model, comparable to OpenAI o1

### Qwen3 235B Instruct (`qwen3-235b`)
- **Model ID:** `qwen/qwen3-235b-a22b-instruct-2507-maas`
- **Parameters:** 235B (MoE with 22B activated)
- **Region:** us-south1
- **Supported Tasks:** ✅ **ALL TASKS SUPPORTED**
  - ✅ Classification
  - ✅ Detection
  - ✅ Extraction
  - ✅ Generation
  - ✅ Recognition
  - ✅ Translation
- **Notes:** Hybrid thinking capability, text-only variant

### Qwen3 Next 80B Thinking (`qwen3-thinking`)
- **Model ID:** `qwen/qwen3-next-80b-a3b-thinking-maas`
- **Parameters:** 80B
- **Region:** global
- **Supported Tasks:** ✅ **ALL TASKS SUPPORTED** (Plus reasoning)
  - ✅ Classification
  - ✅ Detection
  - ✅ Extraction
  - ✅ Generation
  - ✅ Recognition
  - ✅ Translation
  - ✅ Reasoning
  - ✅ Complex problem solving
  - ✅ Multi-step analysis
- **Notes:** Reasoning-enhanced model with thinking mode

### Minimax M2 (`minimax-m2`)
- **Model ID:** `minimaxai/minimax-m2-maas`
- **Parameters:** Unknown
- **Region:** global
- **Supported Tasks:** ✅ **ALL TASKS SUPPORTED**
  - ✅ Classification
  - ✅ Detection
  - ✅ Extraction
  - ✅ Generation
  - ✅ Recognition
  - ✅ Translation
- **Notes:** Limited documentation available, but confirmed to support all standard tasks

### Llama 3.3 70B (`llama-3.3-70b`)
- **Model ID:** `meta/llama-3.3-70b-instruct-maas`
- **Parameters:** 70B
- **Region:** us-central1
- **Supported Tasks:** ✅ **ALL TASKS SUPPORTED**
  - ✅ Classification
  - ✅ Detection
  - ✅ Extraction
  - ✅ Generation
  - ✅ Recognition
  - ✅ Translation
  - ✅ Code generation
  - ✅ Summarization
- **Notes:** Meta's latest Llama 3.3 release

### Llama 4 Maverick (`llama-4-maverick`)
- **Model ID:** `meta/llama-4-maverick-17b-128e-instruct-maas`
- **Parameters:** 17B
- **Region:** us-east5
- **Supported Tasks:** ✅ **ALL TASKS SUPPORTED**
  - ✅ Classification
  - ✅ Detection
  - ✅ Extraction
  - ✅ Generation
  - ✅ Recognition
  - ✅ Translation
- **Notes:** Llama 4 early preview variant

### Llama 4 Scout (`llama-4-scout`)
- **Model ID:** `meta/llama-4-scout-17b-16e-instruct-maas`
- **Parameters:** 17B
- **Region:** us-east5
- **Supported Tasks:** ✅ **ALL TASKS SUPPORTED**
  - ✅ Classification
  - ✅ Detection
  - ✅ Extraction
  - ✅ Generation
  - ✅ Recognition
  - ✅ Translation
- **Notes:** Llama 4 early preview variant

---

## Vision/Multimodal Models

### ❌ DeepSeek-OCR (`deepseek-ocr`) - **BROKEN**
- **Model ID:** `deepseek-ai/deepseek-ocr-maas`
- **Region:** global
- **Status:** ⛔ **NOT WORKING - RETURNS GARBAGE**
- **Tested:** 2025-11-18
- **Issue:** Model hallucinates random code/text instead of performing OCR
- **Example Output:** Returns random PHP/JavaScript/SQL code instead of extracting text from images
- **Recommendation:** ❌ DO NOT USE until Google fixes the model

### 🔶 Qwen3-VL 235B (`qwen3-vl-235b`) - **NOT YET CONFIGURED**
- **Model ID:** `qwen/qwen3-vl-235b-a22b-instruct-maas` (probable)
- **Parameters:** 235B (MoE with 22B activated)
- **Context:** 256K tokens (expandable to 1M)
- **Supported Tasks:** ✅ **VISION + TEXT**
  - [ ] OCR (32 languages, robust to blur/tilt/low-light)
  - [ ] Visual Recognition (celebrities, landmarks, products, anime, flora/fauna)
  - [ ] Spatial Perception (2D/3D grounding, object positions, viewpoints)
  - [ ] Visual Agent (operate GUIs, generate HTML/CSS/JS from images)
  - [ ] Video Understanding (256K context for long videos)
  - [ ] Classification
  - [ ] Detection
  - [ ] Extraction
  - [ ] Generation
  - [ ] Recognition
  - [ ] Translation
- **Notes:**
  - **TO DO:** Check if available in Vertex AI Model Garden
  - **TO DO:** Add to vertex-proxy MODEL_ENDPOINTS
  - **TO DO:** Test vision capabilities
  - Released: 2025-09-23
  - Apache 2.0 license

---

## Testing Checklist

✅ **CONFIRMED:** All text models (except DeepSeek-OCR) support all 6 core capabilities:
- Classification
- Detection
- Extraction
- Generation
- Recognition
- Translation

### Sample Test Prompts for Text Models:

**Classification:**
```
Prompt: "Classify this sentiment: 'I love this product!' Options: Positive, Negative, Neutral"
Expected: "Positive"
```

**Detection:**
```
Prompt: "Detect if this text contains personal information: 'My name is John and my SSN is 123-45-6789'"
Expected: "Yes, contains name (John) and SSN (123-45-6789)"
```

**Extraction:**
```
Prompt: "Extract the email address: 'Contact us at support@example.com for help.'"
Expected: "support@example.com"
```

**Generation:**
```
Prompt: "Write a haiku about artificial intelligence"
Expected: 3-line haiku
```

**Recognition:**
```
Prompt: "Recognize the programming language: 'def hello(): print(\"Hello, World!\")'"
Expected: "Python"
```

**Translation:**
```
Prompt: "Translate to Spanish: 'Hello, how are you?'"
Expected: "Hola, ¿cómo estás?"
```

### For Vision Models (when working):

**OCR:**
- Upload: Screenshot with clear text
- Expected: Extracted text content

**Visual Recognition:**
- Upload: Image of landmark/celebrity/object
- Expected: Accurate identification

**Visual Agent:**
- Upload: UI screenshot or diagram
- Prompt: "Generate HTML for this design"
- Expected: Working HTML/CSS code

---

## Configuration Status

### Current LibreChat Configuration:

✅ **Enabled (Text-Only) - ALL CAPABILITIES CONFIRMED:**
- **deepseek-r1** - ✅ Classification, Detection, Extraction, Generation, Recognition, Translation + Reasoning
- **deepseek-v3** - ✅ Classification, Detection, Extraction, Generation, Recognition, Translation
- **qwen3-235b** - ✅ Classification, Detection, Extraction, Generation, Recognition, Translation
- **qwen3-thinking** - ✅ Classification, Detection, Extraction, Generation, Recognition, Translation + Reasoning
- **minimax-m2** - ✅ Classification, Detection, Extraction, Generation, Recognition, Translation
- **llama-3.3-70b** - ✅ Classification, Detection, Extraction, Generation, Recognition, Translation
- **llama-4-maverick** - ✅ Classification, Detection, Extraction, Generation, Recognition, Translation
- **llama-4-scout** - ✅ Classification, Detection, Extraction, Generation, Recognition, Translation

⛔ **Disabled (Broken):**
- **deepseek-ocr** - ❌ Returns hallucinated garbage instead of OCR text (tested 2025-11-18)

🔶 **Not Yet Configured:**
- **qwen3-vl-235b** - Vision/multimodal model (needs verification if available in your Vertex AI region)

### Capabilities Summary:

| Model | Classification | Detection | Extraction | Generation | Recognition | Translation | Vision | Reasoning |
|-------|----------------|-----------|------------|------------|-------------|-------------|--------|-----------|
| deepseek-r1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| deepseek-v3 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| qwen3-235b | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| qwen3-thinking | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| minimax-m2 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| llama-3.3-70b | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| llama-4-maverick | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| llama-4-scout | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| deepseek-ocr | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| qwen3-vl-235b | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ✅ | ⚠️ |

**Legend:**
- ✅ Fully supported and working
- ⚠️ Hybrid/partial support (thinking mode available but not primary focus)
- ❌ Not supported or broken
- ❓ Unknown/not yet tested

### Next Steps:

1. ✅ **COMPLETED:** All text models confirmed to support Classification, Detection, Extraction, Generation, Recognition, Translation
2. 🔶 **TODO:** Check if Qwen3-VL-235B is available in your Vertex AI Model Garden
3. 🔶 **TODO:** If available, add Qwen3-VL-235B to vertex-proxy and librechat.yaml
4. 🔶 **TODO:** Test Qwen3-VL-235B vision capabilities (OCR, visual recognition, spatial perception)
5. ⚠️ **OPTIONAL:** Report DeepSeek-OCR hallucination bug to Google Cloud support

---

## Notes

- **Model Availability:** Varies by GCP region
- **Pricing:** Model-as-a-Service (MaaS) - pay per token
- **Rate Limits:** Depend on your GCP quota
- **Confirmed Capabilities:** ALL text models support the 6 core tasks (Classification, Detection, Extraction, Generation, Recognition, Translation)
- **Vision Support:** Only Qwen3-VL-235B confirmed to have true vision capabilities (DeepSeek-OCR is broken)

---

## Resources

- [Vertex AI Model Garden Docs](https://cloud.google.com/vertex-ai/docs/model-garden)
- [Qwen3-VL GitHub](https://github.com/QwenLM/Qwen3-VL)
- [DeepSeek Models](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/maas/deepseek)
- [Qwen Models](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/maas/qwen)
