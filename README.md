<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Family First - AI Partner in Family Court

A progressive web app (PWA) providing AI-powered legal assistance for family court in Indiana. Research statutes, draft motions, and chat with an AI legal expert.

## Features

- 🤖 **AI Assistant** - Chat with an expert about case strategy
- 🔍 **Legal Research** - Find Indiana precedents and statutes (Title 31)
- 📝 **Draft Motions** - Generate court-ready motions tailored to your facts
- 📁 **Case Files** - Manage evidence and documents securely
- 📱 **PWA Support** - Works offline, installable on mobile and desktop
- 💾 **Local Storage** - Files and chat history stored locally

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set your Gemini API key in [.env.local](.env.local):
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser

## Deploy to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Set environment variable in Vercel dashboard:
   - Go to your project settings
   - Navigate to **Environment Variables**
   - Add `VITE_GEMINI_API_KEY` with your Gemini API key
   - Redeploy: `vercel --prod`

### Option 2: Deploy via GitHub

1. Push your code to GitHub

2. Go to [vercel.com/new](https://vercel.com/new)

3. Import your repository

4. Configure environment variables:
   - Add `VITE_GEMINI_API_KEY` = Your Gemini API key

5. Click **Deploy**

### Option 3: Manual Deployment

1. Build the app:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to Vercel:
   ```bash
   vercel --prod
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Your Google Gemini API key | Yes |
| `GEMINI_API_KEY` | Alternative API key (legacy) | No |

Get your API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Tech Stack

- **Frontend:** React 19, TypeScript, TailwindCSS
- **Build Tool:** Vite
- **AI:** Google Gemini (3 Pro & 3 Flash)
- **PWA:** Service Worker with offline support
- **PDF:** html2pdf.js for document export
- **Deployment:** Vercel-ready with SPA routing

## Project Structure

```
family-first/
├── components/          # React components
│   ├── Sidebar.tsx
│   └── DisclaimerModal.tsx
├── services/
│   └── geminiService.ts  # AI service with retry logic
├── lib/
│   └── pdf.ts            # PDF generation utilities
├── public/               # Static assets
│   ├── manifest.json     # PWA manifest
│   └── sw.js             # Service worker
├── vercel.json           # Vercel configuration
└── .env.local            # Environment variables (not committed)
```

## PWA Features

- ✅ Offline support via Service Worker
- ✅ Installable on mobile and desktop
- ✅ Responsive design (mobile-first)
- ✅ Safe area insets for notched devices
- ✅ Touch-optimized (44px minimum targets)
- ✅ Theme color and splash screen

## License

Private - All rights reserved
