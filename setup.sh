#!/bin/bash

echo "🚀 MedGPT Setup Script"
echo "======================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# AI Provider Configuration
OPENAI_API_KEY=your_openai_api_key_here
AI_MODEL=gpt-4
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database Configuration
DATABASE_URL=./medgpt.db

# Security (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=medgpt-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=medgpt-super-secret-session-key-change-this-in-production
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/medgpt.log

# Medical Safety Configuration
SAFETY_ENABLED=true
TRIAGE_ENABLED=true
CITATION_ENABLED=true
EXPORT_ENABLED=true

# Analytics (Optional)
ANALYTICS_ENABLED=false
ANALYTICS_KEY=your_analytics_key_here
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "📦 Installing server dependencies..."
cd server && npm install && cd ..

echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

# Initialize database
echo "🗄️ Initializing database..."
npm run db:init

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file and add your OpenAI API key"
echo "2. Run 'npm run dev' to start the application"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "For detailed instructions, see SETUP.md" 