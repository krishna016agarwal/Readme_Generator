@echo off
echo Creating .env file for backend...
cd backend
echo # GitHub API Token (optional but recommended for higher rate limits > .env
echo # Get one from: https://github.com/settings/tokens >> .env
echo GITHUB_TOKEN= >> .env
echo. >> .env
echo # Google Gemini API Key (required) >> .env
echo # Get one from: https://makersuite.google.com/app/apikey >> .env
echo GEMINI_API_KEY= >> .env
echo. >> .env
echo # Server Port (optional, defaults to 5000) >> .env
echo PORT=5000 >> .env
echo. >> .env
echo ✅ .env file created! Please edit backend/.env with your API keys.
echo.
echo To get your API keys:
echo 1. Gemini API: https://makersuite.google.com/app/apikey
echo 2. GitHub Token: https://github.com/settings/tokens
pause

