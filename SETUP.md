# Japan Journal — Setup Guide

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
npx wrangler kv:namespace create JOURNAL_KV
# Copy the ID it gives you into wrangler.toml

npx wrangler secret put TWILIO_ACCOUNT_SID
npx wrangler secret put TWILIO_AUTH_TOKEN
npx wrangler secret put TWILIO_WHATSAPP_FROM   # sandbox number without +
npx wrangler secret put CLAUDE_API_KEY
npx wrangler secret put USER_PHONE             # your number e.g. +12223334444

npx wrangler deploy
# Note the worker URL it gives you (e.g. https://japan-journal.abc.workers.dev)
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
