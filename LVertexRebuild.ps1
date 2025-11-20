# Stop vertex-proxy
docker-compose -f docker-compose.windows.yml stop vertex-proxy

# Remove the old container and image
#docker rm vertex-proxy
#docker rmi libre_vertex-proxy

# Rebuild with no cache
docker-compose -f docker-compose.windows.yml build --no-cache vertex-proxy

# Start it
docker-compose -f docker-compose.windows.yml up -d vertex-proxy

# Wait for containers to start (3 seconds)
Start-Sleep -Seconds 3

# Script to open the default browser with a specific URL
$url = "http://localhost:3080/"
Start-Process $url