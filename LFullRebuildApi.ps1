# 1. Stop everything
docker-compose -f docker-compose.windows.yml down

# 2. Clean up the broken build cache
docker builder prune -a -f

# 3. Delete the old image
docker rmi librechat-judge0:latest

# 4. Rebuild
docker-compose -f docker-compose.windows.yml build --no-cache api

# 5. Start it up
docker-compose -f docker-compose.windows.yml up -d

# Wait for containers to start (3 seconds)
Start-Sleep -Seconds 3

# Script to open the default browser with a specific URL
$url = "http://localhost:3080/"
Start-Process $url