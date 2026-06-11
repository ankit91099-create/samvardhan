# Hostinger Deployment Guide — Samvardhan Bloom Backend

## Step 1: MongoDB Atlas Setup
1. Go to https://cloud.mongodb.com
2. Create a free cluster (M0)
3. Database Access → Add user with password
4. Network Access → Add IP: 147.93.101.32 (Hostinger server IP)
5. Connect → Drivers → copy the SRV connection string

## Step 2: Environment Variables in Hostinger
Go to: Websites → your Node.js app → Settings → Environment Variables
Add EVERY variable from .env.example with your real values.
KEY variables that MUST be set:
- NODE_ENV = production
- MONGO_URI = (your Atlas SRV string)
- JWT_SECRET = (64+ random chars)
- JWT_REFRESH_SECRET = (64+ different random chars)
- ALLOWED_ORIGINS = (your frontend Hostinger URL)

## Step 3: Upload
1. Zip this folder (without node_modules)
2. Upload to Hostinger → your Node.js app → Upload files
3. Root directory: samvardhan-backend
4. Entry file: server.js
5. Framework: Express
6. Node version: 18.x

## Step 4: Verify
Visit: https://your-backend.hostingersite.com/api/health
Expected: { "success": true, "status": "ok" }
