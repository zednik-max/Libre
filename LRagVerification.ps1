Write-Host "`n=== LibreChat RAG Verification ===" -ForegroundColor Cyan

Write-Host "`n1. Configuration Check:" -ForegroundColor Yellow
docker exec LibreChat cat .env | Select-String -Pattern "EMBED|OPENAI"

Write-Host "`n2. Container Status:" -ForegroundColor Yellow
docker ps --filter "name=rag_api" --format "{{.Names}}: {{.Status}}"
docker ps --filter "name=vectordb" --format "{{.Names}}: {{.Status}}"

Write-Host "`n3. RAG API Health:" -ForegroundColor Yellow
docker logs rag_api --tail 5

Write-Host "`n4. Vector Database Count:" -ForegroundColor Yellow
docker exec vectordb psql -U myuser -d mydatabase -c "SELECT COUNT(*) FROM langchain_pg_embedding;"

Write-Host "`n=== Verification Complete ===" -ForegroundColor Cyan