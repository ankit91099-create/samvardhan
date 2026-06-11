# Hostinger Deployment Guide — Samvardhan Bloom Frontend

## How to deploy this frontend on Hostinger

### Step 1: Set your backend URL
Open the .env file and replace the placeholder:
  VITE_API_URL=https://YOUR-ACTUAL-BACKEND.hostingersite.com/api

### Step 2: Build the project
Run these commands on your computer:
  npm install
  npm run build

This creates a "dist" folder.

### Step 3: Upload to Hostinger Static Site / Website
Option A — Hostinger static hosting:
  Upload the CONTENTS of the "dist" folder (not the folder itself)
  to your Hostinger public_html directory

Option B — Hostinger Node.js app (serve dist with Express):
  Use the included backend server which can serve the frontend too.
  See the backend HOSTINGER_SETUP.md for combined deployment.

### Step 4: SPA Routing fix
The public/_redirects file handles React Router routes so pages like
/services, /contact, /admin/login don't return 404 on refresh.
Make sure this file is in your upload.

### Note on .env
The .env file is only used during the build step (npm run build).
After building, the API URL is baked into the dist files.
You do NOT need to set environment variables in Hostinger for the frontend.
