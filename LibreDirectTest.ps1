curl -X POST http://localhost:4000/v1/chat/completions `
  -H "Content-Type: application/json" `
  -d '{
    "model": "deepseek-v3",
    "messages": [{"role": "user", "content": "Say hello in one word"}],
    "stream": false
  }'