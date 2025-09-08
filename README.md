# Public Repository README Generator

A web application that automatically generates professional README.md files for any public GitHub repository using the GitHub API and Google Gemini AI.

## Features

- 🚀 **One-Click Generation**: Simply paste a GitHub repository URL
- 🤖 **AI-Powered Content**: Uses Google Gemini to generate comprehensive README content
- 📊 **Rich Metadata**: Displays repository statistics, languages, topics, and more
- 🎨 **Modern UI**: Beautiful, responsive interface with glass morphism design
- 📱 **Mobile Friendly**: Works seamlessly on all devices
- ⚡ **Fast Processing**: Generates READMEs in 1-2 minutes

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express.js
- **APIs**: GitHub API, Google Gemini API
- **Styling**: Glass morphism, neon accents, responsive design

## Prerequisites

Before running this project, you'll need:

1. **Node.js** (v16 or higher)
2. **Google Gemini API Key** - Get one from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **GitHub Token** (optional but recommended) - Get one from [GitHub Settings](https://github.com/settings/tokens)

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd bytetask
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the `backend` directory:
   ```env
   GITHUB_TOKEN=your_github_token_here
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=5000
   ```

## Usage

1. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```
   The server will run on `http://localhost:5000`

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

3. **Open your browser** and navigate to `http://localhost:5173`

4. **Generate a README**:
   - Paste any public GitHub repository URL
   - Click "Generate README"
   - Wait for the AI to process the repository
   - Copy, download, or preview the generated README

## Project Structure

```
bytetask/
├── backend/
│   ├── server.js          # Express server with API endpoints
│   ├── package.json       # Backend dependencies
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ReadmeGenerator.tsx  # Main component
│   │   │   └── ui/                 # shadcn/ui components
│   │   ├── pages/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## API Endpoints

- `POST /api/generate-readme` - Generate README for a repository
  - Body: `{ repoUrl: string, options: object }`
  - Response: `{ generatedReadme: string, meta: object }`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting

### Common Issues

1. **"Gemini API key is not configured"**
   - Make sure you've set the `GEMINI_API_KEY` in your `.env` file

2. **"Repository not found"**
   - Ensure the repository URL is correct and the repository is public
   - Check if you have a valid GitHub token for private repositories

3. **CORS errors**
   - Make sure both frontend and backend servers are running
   - Check that the frontend is pointing to the correct backend URL

4. **Rate limit exceeded**
   - GitHub API has rate limits. Consider adding a GitHub token to increase limits
   - Wait a few minutes before trying again

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
