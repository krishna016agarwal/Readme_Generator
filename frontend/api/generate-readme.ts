import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

async function fetchRepoData(repoUrl: string) {
  if (!repoUrl.includes('github.com')) {
    throw new Error('Invalid GitHub repository URL');
  }

  const parts = repoUrl.split('github.com/')[1].split('/');
  if (parts.length < 2) {
    throw new Error('Invalid GitHub repository URL format');
  }

  const owner = parts[0];
  const repo = parts[1].replace('.git', '').replace('/', '');

  const headers: Record<string, string> = {
    'User-Agent': 'readme-generator',
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  const repoRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  const languagesRes = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/languages`,
    { headers }
  );
  const topicsRes = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/topics`,
    { headers: { ...headers, Accept: 'application/vnd.github.mercy-preview+json' } }
  );

  // README (raw)
  let readme = '';
  try {
    const readmeRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      { headers: { ...headers, Accept: 'application/vnd.github.v3.raw' } }
    );
    readme = typeof readmeRes.data === 'string' ? readmeRes.data : '';
  } catch {}

  // Contributors (top 10)
  let contributors: string[] = [];
  try {
    const contributorsRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=10`,
      { headers }
    );
    contributors = Array.isArray(contributorsRes.data)
      ? contributorsRes.data.map((c: any) => c.login).filter(Boolean)
      : [];
  } catch {}

  // Language percentages
  const languageByteCounts = languagesRes.data || {};
  const totalLanguageBytes = Object.values(languageByteCounts).reduce(
    (sum: number, val: any) => sum + (typeof val === 'number' ? val : 0),
    0
  );
  const languagesBreakdown = Object.fromEntries(
    Object.entries(languageByteCounts).map(([lang, bytes]) => {
      const byteCount = Number(bytes) || 0;
      const pct = totalLanguageBytes > 0 ? Math.round((byteCount / totalLanguageBytes) * 100) : 0;
      return [lang, pct];
    })
  );

  // Structure (top-level)
  const defaultBranch = repoRes.data.default_branch || 'main';
  let projectStructure: string[] = [];
  try {
    const treeRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      { headers }
    );
    const allPaths = Array.isArray(treeRes.data?.tree) ? treeRes.data.tree.map((t: any) => t.path) : [];
    const topLevel = new Set<string>();
    for (const p of allPaths) {
      const segs = String(p).split('/');
      if (segs.length === 1) topLevel.add(segs[0]);
      else if (segs.length > 1) topLevel.add(segs[0] + '/');
    }
    projectStructure = Array.from(topLevel).filter(Boolean).sort((a, b) => a.localeCompare(b));
  } catch {}

  return {
    name: repoRes.data.name,
    full_name: repoRes.data.full_name,
    description: repoRes.data.description || '',
    stars: repoRes.data.stargazers_count,
    forks: repoRes.data.forks_count,
    license: repoRes.data.license ? repoRes.data.license.name : '',
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
}

async function generateReadme(repoData: any) {
  const data = {
    name: repoData.name,
    fullName: repoData.full_name,
    description: repoData.description,
    stars: repoData.stars,
    forks: repoData.forks,
    license: repoData.license || 'No license provided',
    topics: repoData.topics,
    url: repoData.html_url,
    languages: repoData.languages,
    languagesBreakdown: repoData.languagesBreakdown,
    existingReadme: repoData.readme,
    projectStructure: repoData.projectStructure,
  };

  const prompt = `
You are a README.md generator. Produce a professional README using ONLY the JSON below.
Never invent data. No badges. No contributors.

PROJECT DATA (JSON):
${JSON.stringify(data, null, 2)}

OUTPUT FORMAT (strict):

# Title

{name}

## Description
{1–3 sentences based on description and (optionally) existingReadme/topics}

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

## Installation Steps
1. Clone
~~~bash
git clone {url}
cd {name}
~~~
2. Install
~~~bash
npm install
~~~
3. Env setup (examples if implied)
- e.g., MONGODB_URI, CLOUDINARY_* in .env.local

4. Dev
~~~bash
npm run dev
~~~
5. Build/Start
~~~bash
npm run build && npm run start
~~~

## Project Structure
Top-level items:
{bullet list from projectStructure (max 15)}

## License
{license}
`;

  const resp = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    { contents: [{ role: 'user', parts: [{ text: prompt }] }] },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const text = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text) throw new Error('Gemini API returned no content');
  return text;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const { repoUrl } = req.body || {};
    if (!repoUrl) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }
    const repoData = await fetchRepoData(repoUrl);
    const generatedReadme = await generateReadme(repoData);
    const meta = {
      name: repoData.name,
      description: repoData.description,
      language: repoData.languages[0] || 'Unknown',
      stars: repoData.stars,
      forks: repoData.forks,
      license: repoData.license || 'No license provided',
      topics: repoData.topics,
      lastUpdated: repoData.updated_at,
      languagesBreakdown: repoData.languagesBreakdown,
      url: repoData.html_url,
      projectStructure: repoData.projectStructure,
    };
    return res.status(200).json({ generatedReadme, meta });
  } catch (err: any) {
    console.error('API error:', err.response?.data || err.message);
    const msg = err?.message || 'Internal error';
    if (/not found/i.test(msg)) return res.status(404).json({ error: msg });
    if (/rate limit/i.test(msg)) return res.status(429).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}


