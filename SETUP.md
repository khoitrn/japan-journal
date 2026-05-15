# Japan Journal — Setup Guide

## Storage architecture (updated May 2026)

Three Cloudflare services handle all data:

| Service | What it stores | Why |
|---|---|---|
| **D1** (SQLite database) | Journal entries, jottings, photo metadata, voice profile | Structured data with real queries. Strongly consistent — no more "save then disappear" bugs. |
| **R2** (object storage) | Photo image files | Photos live here as actual files, not stuffed into text records. Zero egress cost, permanent URLs. |
| **KV** (key-value) | Auth session tokens | Still fast and good for simple key lookups. |

**How a photo upload works:**
1. You pick a photo on your phone → resized to 1600px → sent to the Worker
2. Worker saves the image file to **R2** → gets back a permanent URL
3. Worker writes `{id, day, r2_key}` into **D1**'s photos table
4. Your journal stores the URL, not the raw image — tiny, fast, reliable

**D1 table layout:**
```
journal_entries  →  day, date, city, status, jottings (JSON), sections (JSON, no photos)
photos           →  id, day, r2_key, caption, position
voice_profile    →  description, sample, rules (JSON)
```

**One-time migration** (if setting up from scratch with existing KV data):
```js
// Run in browser console while logged in as admin at journal.khoitrn.com
fetch('https://japan-journal.khoitrn.workers.dev/api/migrate', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + sessionStorage.getItem('admin_token') }
}).then(r => r.json()).then(console.log)
// → { ok: true, migrated: N }
```

---

## One-time setup (do this before May 11)

### 1. Twilio WhatsApp Sandbox
1. Sign up at twilio.com (free)
2. Go to Messaging → Try it out → Send a WhatsApp message
3. Scan the QR code with your phone to join the sandbox
4. Note your sandbox number (e.g. +14155238886)

### 2. Cloudflare Worker
```bash
cd worker
npm install

# Create storage resources
npx wrangler kv:namespace create JOURNAL_KV       # copy ID → wrangler.toml
npx wrangler d1 create japan-journal-db --location enam   # copy ID → wrangler.toml
npx wrangler r2 bucket create japan-journal-photos

# Apply D1 schema
npx wrangler d1 execute japan-journal-db --remote --file=migrations/0001_initial.sql

# Set secrets
npx wrangler secret put TWILIO_ACCOUNT_SID
npx wrangler secret put TWILIO_AUTH_TOKEN
npx wrangler secret put TWILIO_WHATSAPP_FROM   # sandbox number e.g. +14155238886
npx wrangler secret put CLAUDE_API_KEY
npx wrangler secret put USER_PHONE             # your number e.g. +12223334444

npx wrangler deploy
# Note the worker URL (e.g. https://japan-journal.khoitrn.workers.dev)
```

Set the Twilio webhook URL to: `https://japan-journal.YOUR.workers.dev/webhook`
(Twilio → Messaging → Sandbox → "When a message comes in")

### 3. Frontend (Cloudflare Pages)
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local: set VITE_WORKER_URL to your worker URL

npm run build
```

Deploy `frontend/dist/` to Cloudflare Pages → connect to `journal.khoitrn.com`

### 4. Set your voice profile
Send this to your Twilio WhatsApp number before the trip:
```
VOICE: I write casually and directly, like I'm texting a friend. 
I use short sentences. I get excited about details. 
I'm reflective but not formal. I ask a lot of questions when I'm curious.
```

## Daily flow on the trip
- Jot anything to your Twilio number throughout the day
- At 7:30 PM JST → get a draft preview on WhatsApp
- Reply naturally to fill gaps or make edits
- Reply DONE → get the export link
- Open journal.khoitrn.com/day/[N] → review → Export PDF → Canvas by 8:00 PM

## Local development
```bash
# Terminal 1 — worker
cd worker && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
# Open http://localhost:5173
```
