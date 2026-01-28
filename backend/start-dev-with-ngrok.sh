#!/bin/bash
# Bash script to start Django development server with ngrok
# This allows Midtrans and Digiflazz webhooks to reach your local server

echo "🚀 Starting Roxas Backend Development Environment with Ngrok"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ Ngrok is not installed!"
    echo ""
    echo "📥 Install ngrok:"
    echo "   Download from: https://ngrok.com/download"
    echo ""
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from env.example..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "✅ Created .env file. Please update with your credentials."
    else
        echo "❌ env.example not found!"
        exit 1
    fi
fi

# Check if ngrok.yml exists
if [ ! -f "ngrok.yml" ]; then
    echo "⚠️  ngrok.yml not found. Creating from ngrok.yml.example..."
    if [ -f "ngrok.yml.example" ]; then
        cp ngrok.yml.example ngrok.yml
        echo "✅ Created ngrok.yml file."
        echo ""
        echo "📝 Next steps:"
        echo "   1. Go to: https://dashboard.ngrok.com/get-started/your-authtoken"
        echo "   2. Copy your authtoken"
        echo "   3. Edit ngrok.yml and replace YOUR_NGROK_AUTHTOKEN_HERE"
        echo ""
        exit 1
    else
        echo "❌ ngrok.yml.example not found!"
        exit 1
    fi
fi

# Check if ngrok authtoken is configured
if grep -q "YOUR_NGROK_AUTHTOKEN_HERE" ngrok.yml; then
    echo "⚠️  Ngrok authtoken not configured!"
    echo ""
    echo "📝 Setup ngrok authtoken:"
    echo "   1. Go to: https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "   2. Copy your authtoken"
    echo "   3. Update ngrok.yml file with your authtoken"
    echo ""
    read -p "Continue without authtoken? (Y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Start Django server in background
echo "🔧 Starting Django development server..."
python manage.py runserver &
DJANGO_PID=$!

# Wait for Django to start
sleep 3

# Check if Django is running
if curl -s http://localhost:8000 > /dev/null; then
    echo "✅ Django server started successfully!"
else
    echo "⚠️  Django server might not be ready yet..."
fi

echo ""
echo "🌐 Starting ngrok tunnel..."
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $DJANGO_PID 2>/dev/null
    pkill -f "manage.py runserver" 2>/dev/null
    echo "✅ Cleanup complete"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Start ngrok
ngrok start backend --config=ngrok.yml

# Cleanup on exit
cleanup
