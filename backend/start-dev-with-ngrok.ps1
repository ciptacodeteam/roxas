# PowerShell script to start Django development server with ngrok
# This allows Midtrans and Digiflazz webhooks to reach your local server

Write-Host "🚀 Starting Roxas Backend Development Environment with Ngrok" -ForegroundColor Green
Write-Host ""

# Check if ngrok is installed
$ngrokInstalled = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokInstalled) {
    Write-Host "❌ Ngrok is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Install ngrok:" -ForegroundColor Yellow
    Write-Host "   1. Download from: https://ngrok.com/download" -ForegroundColor Cyan
    Write-Host "   2. Or use: choco install ngrok" -ForegroundColor Cyan
    Write-Host "   3. Or use: scoop install ngrok" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from env.example..." -ForegroundColor Yellow
    if (Test-Path "env.example") {
        Copy-Item "env.example" ".env"
        Write-Host "✅ Created .env file. Please update with your credentials." -ForegroundColor Green
    } else {
        Write-Host "❌ env.example not found!" -ForegroundColor Red
        exit 1
    }
}

# Check if ngrok.yml exists
if (-not (Test-Path "ngrok.yml")) {
    Write-Host "⚠️  ngrok.yml not found. Creating from ngrok.yml.example..." -ForegroundColor Yellow
    if (Test-Path "ngrok.yml.example") {
        Copy-Item "ngrok.yml.example" "ngrok.yml"
        Write-Host "✅ Created ngrok.yml file." -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Next steps:" -ForegroundColor Yellow
        Write-Host "   1. Go to: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor Cyan
        Write-Host "   2. Copy your authtoken" -ForegroundColor Cyan
        Write-Host "   3. Edit ngrok.yml and replace YOUR_NGROK_AUTHTOKEN_HERE" -ForegroundColor Cyan
        Write-Host ""
        exit 1
    } else {
        Write-Host "❌ ngrok.yml.example not found!" -ForegroundColor Red
        exit 1
    }
}

# Check if ngrok authtoken is configured
$ngrokConfig = Get-Content "ngrok.yml" -Raw
if ($ngrokConfig -match "YOUR_NGROK_AUTHTOKEN_HERE") {
    Write-Host "⚠️  Ngrok authtoken not configured!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 Setup ngrok authtoken:" -ForegroundColor Yellow
    Write-Host "   1. Go to: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor Cyan
    Write-Host "   2. Copy your authtoken" -ForegroundColor Cyan
    Write-Host "   3. Update ngrok.yml file with your authtoken" -ForegroundColor Cyan
    Write-Host ""
    $continue = Read-Host "Continue without authtoken? (Y/N)"
    if ($continue -ne "Y") {
        exit 1
    }
}

# Start Django server in background
Write-Host "🔧 Starting Django development server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; python manage.py runserver" -WindowStyle Normal

# Wait for Django to start
Start-Sleep -Seconds 3

# Check if Django is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000" -TimeoutSec 2 -UseBasicParsing
    Write-Host "✅ Django server started successfully!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Django server might not be ready yet..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌐 Starting ngrok tunnel..." -ForegroundColor Cyan
Write-Host ""

# Start ngrok
ngrok start backend --config=ngrok.yml

# Note: Ngrok will take over the terminal. Press Ctrl+C to stop.
