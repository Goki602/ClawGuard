#!/bin/sh
# Simple HTTP fetcher proxy for ClawGuard Docker setup
# Listens on port 8080 and proxies external HTTP requests

echo "ClawGuard Fetcher ready"

# Keep container running - in production, this would be a proper HTTP proxy
while true; do
  sleep 3600
done
