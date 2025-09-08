#!/bin/bash

# Setup script for Public Repository README Generator

echo "🚀 Setting up Public Repository README Generator..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

echo "✅ Node.js is installed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOL
# GitHub API Token (optional but recommended for higher rate limits)
# Get one from: https://github.com/settings/tokens
GITHUB_TOKEN=your_github_token_here

# Google Gemini API Key (required)
# Get one from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Server Port (optional, defaults to 5000)
PORT=5000
EOL
    echo "✅ Created .env file. Please edit it with your API keys."
else
    echo "✅ .env file already exists"
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your API keys"
echo "2. Start the backend: cd backend && npm start"
echo "3. Start the frontend: cd frontend && npm run dev"
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo "For detailed instructions, see README.md"
