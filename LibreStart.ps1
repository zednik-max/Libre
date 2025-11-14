# Start all services using Windows-optimized compose file
docker-compose -f docker-compose.windows.yml up -d

# Wait for containers to start (6 seconds)
Start-Sleep -Seconds 6

# Script to open the default browser with a specific URL
$url = "http://localhost:3080/"
Start-Process $url