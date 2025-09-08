import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173',"https://readme-generator-vhzg-634061tgx-krishna-agarwal-s-projects.vercel.app"],
  credentials: true
}));

const PORT = 5000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ================== Helper: Fetch GitHub Repo Metadata ==================
async function fetchRepoData(repoUrl) {
  try {
    if (!repoUrl.includes("github.com")) {
      throw new Error("Invalid GitHub repository URL");
    }

    const parts = repoUrl.split("github.com/")[1].split("/");
    if (parts.length < 2) {
      throw new Error("Invalid GitHub repository URL format");
    }
    
    const owner = parts[0];
    const repo = parts[1].replace(".git", "").replace("/", "");

    if (!owner || !repo) {
      throw new Error("Could not extract owner and repository name from URL");
    }

    const headers = {
      ...(GITHUB_TOKEN && { Authorization: `Bearer ${GITHUB_TOKEN}` }),
      "User-Agent": "readme-generator",
    };

    const repoRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers }
    );

    const languagesRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/languages`,
      { headers }
    );

    const topicsRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/topics`,
      { headers: { ...headers, Accept: 'application/vnd.github.mercy-preview+json' } }
    );

    // Fetch existing README (raw markdown) if present
    let readme = "";
    try {
      const readmeRes = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/readme`,
        { headers: { ...headers, Accept: 'application/vnd.github.v3.raw' } }
      );
      readme = typeof readmeRes.data === 'string' ? readmeRes.data : "";
    } catch (e) {
      readme = ""; // README may not exist; that's fine
    }

    // Fetch top contributors (logins only)
    let contributors = [];
    try {
      const contributorsRes = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=10`,
        { headers }
      );
      contributors = Array.isArray(contributorsRes.data)
        ? contributorsRes.data.map((c) => c.login).filter(Boolean)
        : [];
    } catch (e) {
      contributors = [];
    }

    // Compute language breakdown percentages from byte counts
    const languageByteCounts = languagesRes.data || {};
    const totalLanguageBytes = Object.values(languageByteCounts).reduce(
      (sum, val) => sum + (typeof val === 'number' ? val : 0),
      0
    );
    const languagesBreakdown = Object.fromEntries(
      Object.entries(languageByteCounts).map(([lang, bytes]) => {
        const byteCount = Number(bytes) || 0;
        const pct = totalLanguageBytes > 0
          ? Math.round((byteCount / totalLanguageBytes) * 100)
          : 0;
        return [lang, pct];
      })
    );

    // Get default branch and project tree (top-level) for structure
    let defaultBranch = repoRes.data.default_branch || "main";
    let projectStructure = [];
    try {
      const treeRes = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
        { headers }
      );
      const allPaths = Array.isArray(treeRes.data?.tree)
        ? treeRes.data.tree.map((t) => t.path)
        : [];
      // Create a simplified structure: top-level folders and key files
      const topLevel = new Set();
      for (const p of allPaths) {
        const parts = String(p).split("/");
        if (parts.length === 1) {
          topLevel.add(parts[0]);
        } else if (parts.length > 1) {
          topLevel.add(parts[0] + "/");
        }
      }
      projectStructure = Array.from(topLevel)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
    } catch (_) {
      projectStructure = [];
    }

    return {
      name: repoRes.data.name,
      full_name: repoRes.data.full_name,
      description: repoRes.data.description || "No description provided",
      stars: repoRes.data.stargazers_count,
      forks: repoRes.data.forks_count,
      license: repoRes.data.license ? repoRes.data.license.name : "Not specified",
      owner: repoRes.data.owner.login,
      html_url: repoRes.data.html_url,
      created_at: repoRes.data.created_at,
      updated_at: repoRes.data.updated_at,
      languages: Object.keys(languageByteCounts),
      languagesBreakdown,
      topics: topicsRes.data.names || [],
      readme,
      contributors,
      defaultBranch,
      projectStructure,
    };
  } catch (err) {
    console.error("GitHub API error:", err.response?.data || err.message);
    
    if (err.response?.status === 404) {
      throw new Error("Repository not found or is private");
    }
    
    if (err.response?.status === 403) {
      throw new Error("GitHub API rate limit exceeded or access denied");
    }
    
    if (err.response?.status === 401) {
      throw new Error("Invalid GitHub token or unauthorized access");
    }
    
    throw new Error(`Failed to fetch repository data: ${err.message}`);
  }
}

// ================== Helper: Generate README via Gemini ==================
async function generateReadme(repoData) {
  try {
    const data = {
      name: repoData.name,
      fullName: repoData.full_name,
      description: repoData.description,
      stars: repoData.stars,
      forks: repoData.forks,
      license: repoData.license,
      topics: repoData.topics,
      url: repoData.html_url,
      languages: repoData.languages,
      languagesBreakdown: repoData.languagesBreakdown,
      contributors: repoData.contributors,
      existingReadme: repoData.readme,
      createdAt: repoData.created_at,
      updatedAt: repoData.updated_at,
      defaultBranch: repoData.defaultBranch,
      projectStructure: repoData.projectStructure,
    };

    const prompt = `
You are a README.md generator. Produce a professional README using ONLY the JSON below.
Never invent data. If something is missing, omit that bullet/section. No badges, no contributors. Always include a Description section when description is available; if not, infer a one-sentence description from existingReadme/topics.

PROJECT DATA (JSON):
${JSON.stringify(data, null, 2)}

DERIVATION RULES (be precise, descriptive):
- Description: 1–3 sentences based on description and (optionally) existingReadme/topics.
- Features: derive concrete features from topics, description and existingReadme; prefer 4-8 strong bullets.
- Tech Stack: include frameworks/tools inferred from topics/README (e.g., Next.js, Tailwind CSS, MongoDB), then list top languages with percentages from languagesBreakdown. Separate framework/tool bullets from languages.
- Installation Guide: provide a realistic flow for JS/TS/Next.js repos (clone, install, env setup with example keys if implied, dev, build/start). Mention env keys only if implied by topics/README (e.g., MongoDB, Cloudinary).
- Structure: use projectStructure to list notable top-level folders/files; for typical Next.js repos, suggest likely subfolders (pages/app, components, lib, public) as "Likely" when not certain.
- License: include only if present.

OUTPUT FORMAT (strict):

# Title

{name}

## Description
{1–3 sentences summary}

## Features
- {feature 1}
- {feature 2}
- {feature 3}
- {feature 4}

## Tech Stack

- {framework/tool 1}
- {framework/tool 2}
- {framework/tool 3}

Languages
- {TopLang1} — {pct1}%
- {TopLang2} — {pct2}%
- {TopLang3} — {pct3}%

## Installation Guide

1. Clone the repository
~~~bash
git clone {url}
cd {name}
~~~
2. Install dependencies
~~~bash
npm install
# or
yarn install
~~~
3. Configure environment variables (if applicable)
- e.g., MongoDB connection string
- e.g., Cloudinary credentials (cloud name, API key/secret)

4. Run the development server
~~~bash
npm run dev
# or
yarn dev
~~~

5. Build for production
~~~bash
npm run build && npm run start
~~~

## Structure (Based on File Tree)

Top-level items:
{bullet list from projectStructure (max 15)}

Likely src/ layout (when applicable):
- pages/ or app/
- components/
- lib/ or utils/
- public/

## License
{license}
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

    if (!text) throw new Error("Gemini API returned no content");

    return text;
  } catch (err) {
    console.error("Gemini API error:", err.response?.data || err.message);
    throw new Error("Failed to generate README using Gemini");
  }
}


app.get("/",(req,res)=>{
  res.redirect(process.env.FRONTEND_URL);
})
// ================== API Endpoint ==================
app.post("/api/generate-readme", async (req, res) => {
  try {
    const { repoUrl, options } = req.body;
    console.log("Received request for:", repoUrl);

    if (!repoUrl) {
      return res.status(400).json({ error: "Repository URL is required" });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is not configured" });
    }

    const repoData = await fetchRepoData(repoUrl);
    const readme = await generateReadme(repoData);

    // Transform repoData to match frontend expectations
    const meta = {
      name: repoData.name,
      description: repoData.description,
      language: repoData.languages[0] || 'Unknown',
      stars: repoData.stars,
      forks: repoData.forks,
      license: repoData.license,
      topics: repoData.topics,
      lastUpdated: repoData.updated_at,
      languagesBreakdown: repoData.languagesBreakdown,
      readmeExisting: repoData.readme,
      url: repoData.html_url,
      projectStructure: repoData.projectStructure,
    };

    res.json({ generatedReadme: readme, meta });
  } catch (err) {
    console.error("Error in /api/generate-readme:", err.message);
    
    // Handle specific error types
    if (err.message.includes("404") || err.message.includes("Not Found")) {
      return res.status(404).json({ error: "Repository not found or is private" });
    }
    
    if (err.message.includes("rate limit")) {
      return res.status(429).json({ error: "API rate limit exceeded. Please try again later." });
    }
    
    res.status(500).json({ error: err.message });
  }
});

// ================== Start Server ==================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
