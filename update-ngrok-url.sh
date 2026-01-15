#!/bin/bash

# Update Ngrok URL in .env file
# This script fetches the current ngrok URL and updates WEBHOOK_BASE_URL in .env

set -e

echo "🔍 Fetching current ngrok URL..."

# Wait for ngrok to be ready
sleep 2

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')

if [ -z "$NGROK_URL" ] || [ "$NGROK_URL" = "null" ]; then
    echo "❌ Failed to fetch ngrok URL. Make sure ngrok container is running."
    echo "   Run: docker-compose ps"
    exit 1
fi

echo "✅ Found ngrok URL: $NGROK_URL"

# Update .env file
if grep -q "WEBHOOK_BASE_URL=" .env; then
    # Update existing line
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|WEBHOOK_BASE_URL=.*|WEBHOOK_BASE_URL=\"$NGROK_URL\"|" .env
    else
        # Linux
        sed -i "s|WEBHOOK_BASE_URL=.*|WEBHOOK_BASE_URL=\"$NGROK_URL\"|" .env
    fi
    echo "✅ Updated WEBHOOK_BASE_URL in .env"
else
    # Add new line
    echo "" >> .env
    echo "# Webhook Base URL (Ngrok URL - auto-updated)" >> .env
    echo "WEBHOOK_BASE_URL=\"$NGROK_URL\"" >> .env
    echo "✅ Added WEBHOOK_BASE_URL to .env"
fi

echo ""
echo "🔄 Restarting app container to apply changes..."
docker-compose restart app

echo ""
echo "⏳ Waiting for app to be ready..."
sleep 5

echo ""
echo "✨ Done! Your app is now accessible at:"
echo "   Local:  http://localhost:3000"
echo "   Ngrok:  $NGROK_URL"
echo ""
echo "🎯 Webhook URL for Xendit:"
echo "   $NGROK_URL/webhooks/xendit"
echo ""
