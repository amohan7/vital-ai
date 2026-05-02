# vital.ai
### Apple Watch health dashboard with Gemini AI analysis

A single Node.js app that serves both the dashboard UI and the
Gemini analysis API — deployed as one unit on Vercel.

---

## Project structure

```
vital-ai/
├── api/
│   ├── analyze.js       ← POST /analyze — Gemini API call
│   └── health.js        ← GET  /health  — ping endpoint
├── public/
│   └── index.html       ← dashboard UI
├── dev-server.js        ← local development server
├── vercel.json          ← Vercel routing config
├── package.json
├── .env.example
├── .gitignore
└── SHORTCUT_SETUP.md    ← iOS Shortcut guide
```

---

## Deploy to Vercel

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
gh repo create vital-ai --public --push
```

### Step 2 — Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New Project**
3. Import your `vital-ai` GitHub repo
4. Vercel auto-detects the config — click **Deploy**

### Step 3 — Add your Gemini API key (optional)

This step is optional — you can also enter the key directly
in the dashboard UI under the ⚙ settings panel.

To set it server-side:
1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add: `GEMINI_API_KEY` = your key from [aistudio.google.com](https://aistudio.google.com)
3. Redeploy

### Step 4 — Open your dashboard

Visit `https://your-app.vercel.app` — the backend URL is
auto-set to the same origin, so no configuration needed.

---

## Local development

```bash
npm install
cp .env.example .env        # add your GEMINI_API_KEY
node dev-server.js          # runs at http://localhost:3000
```

---

## iOS Shortcut

See **SHORTCUT_SETUP.md** for the full step-by-step guide to
connecting your Apple Watch health data to the dashboard.

---

## How it works

```
Apple Watch
    ↓
HealthKit
    ↓
iOS Shortcut (reads 7 days of metrics, no PII)
    ↓
POST https://your-app.vercel.app/analyze
    ↓
Vercel serverless function (api/analyze.js)
    ↓
Gemini API
    ↓
Analysis returned to Shortcut + displayed in dashboard
```

---

## Privacy

- No names, dates, or location data are ever collected
- Health metrics are numbers only (steps, HR, HRV, etc.)
- Your Gemini API key is stored in memory only — never persisted
- No database, no logging of health data
