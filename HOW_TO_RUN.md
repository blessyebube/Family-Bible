# Family Bible — Setup & Hosting Guide

---

## Run Locally

1. Install Node.js from https://nodejs.org (LTS version)
2. Open Terminal / Command Prompt inside this folder
3. Run: npm install
4. Rename .env.example to .env.local and add your GEMINI_API_KEY
5. Run: npx tsx server.ts
6. Open: http://localhost:3000

---

## Admin Access

- The FIRST account you register automatically becomes Admin
- As admin you will see an "Admin" link in the top navigation
- Admin dashboard lets you: view all users, promote/demote admins, delete users, view/delete all albums

---

## Photo Uploads

- Open any album and click "Add Photo"
- Upload JPG, PNG, or WEBP files up to 10MB
- Add an optional caption and date
- Photos are stored in the /uploads folder on the server
- You can delete your own photos; admins can delete any photo

---

## Host for Free on Railway.app (recommended)

Railway gives you a free hosted URL, and you can attach your own domain later.

Step 1 — Push to GitHub
  - Create a free account at github.com
  - Create a new repository (click + → New repository)
  - Upload all your project files to it

Step 2 — Deploy on Railway
  - Go to railway.app and sign up free
  - Click "New Project" → "Deploy from GitHub repo"
  - Select your repository

Step 3 — Add environment variables on Railway
  - In your Railway project, go to Variables tab
  - Add: GEMINI_API_KEY = your key
  - Add: JWT_SECRET = any long random string (e.g. myfamilybible2024secretkey)

Step 4 — Get your URL
  - Railway will build and deploy automatically
  - Go to Settings → Domains to get your free .railway.app URL
  - Or click "Add Custom Domain" to use your own domain

---

## Add Your Own Domain

On Railway:
1. Go to your project → Settings → Domains
2. Click "Add Custom Domain"
3. Enter your domain (e.g. familybible.com)
4. Railway shows you DNS records to add
5. Log into your domain registrar (GoDaddy, Namecheap, etc.)
6. Add the CNAME record Railway gives you
7. Wait 10-30 minutes for it to go live

---

## Notes

- SQLite database file (family_bible.db) stores all data locally
- On Railway, data persists as long as your project is active
- For long-term production use, consider upgrading to PostgreSQL later
