docker-compose -f docker-compose.windows.yml down
docker-compose -f docker-compose.windows.yml build api
docker-compose -f docker-compose.windows.yml up -d

# Wait for containers to start (4 seconds)
Start-Sleep -Seconds 4

# Script to open the default browser with a specific URL
$url = "http://localhost:3080/"
Start-Process $url