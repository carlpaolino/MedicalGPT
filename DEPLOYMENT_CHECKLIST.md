# 🚀 MedicalGPT Deployment Checklist

## ✅ Pre-Deployment Checklist

### Security Keys (Generated)
- [ ] JWT_SECRET: `5058fbce53aa8fe2c4eff2e9fad122291e90670f2b39c125294649d373ac8f7e9299c2138923383c71fe376c993f9f10f2425da3509e4216885f20bfc7d85f70`
- [ ] SESSION_SECRET: `54a5b5cad94c1bd2badbba21c20f941174d23e283e6b787c472d4f70fef975a465f0eb6f1d88927b4fbedbf11e21318ba0a9e46faf3a84f25e27a5d0062ef295`
- [ ] ENCRYPTION_KEY: `21e45259360681fcf61d7fafd43000e95accc34ca4da92a15a6b04542f18673b`

### Required Services
- [ ] OpenAI API key
- [ ] Railway account (for backend)
- [ ] Netlify account (for frontend)
- [ ] GitHub repository

## 🗄️ Backend Deployment (Railway)

### 1. Create Railway Project
- [ ] Sign up at [railway.app](https://railway.app)
- [ ] Connect GitHub account
- [ ] Create new project
- [ ] Deploy from GitHub repo (select `server` directory)

### 2. Add PostgreSQL Database
- [ ] Add PostgreSQL database in Railway
- [ ] Copy DATABASE_URL connection string

### 3. Configure Environment Variables
- [ ] OPENAI_API_KEY
- [ ] AI_MODEL=gpt-3.5-turbo
- [ ] AI_MAX_TOKENS=2000
- [ ] AI_TEMPERATURE=0.7
- [ ] PORT=3001
- [ ] NODE_ENV=production
- [ ] DATABASE_URL (from Railway)
- [ ] JWT_SECRET (from above)
- [ ] SESSION_SECRET (from above)
- [ ] ENCRYPTION_KEY (from above)
- [ ] CORS_ORIGIN (will update after frontend deployment)

### 4. Get Backend URL
- [ ] Copy Railway deployment URL (e.g., `https://your-app.railway.app`)

## 🌐 Frontend Deployment (Netlify)

### 1. Create Netlify Site
- [ ] Sign up at [netlify.com](https://netlify.com)
- [ ] Connect GitHub account
- [ ] Deploy from Git
- [ ] Set build command: `cd client && npm install && npm run build`
- [ ] Set publish directory: `client/build`

### 2. Configure Environment Variables
- [ ] REACT_APP_API_URL=https://your-backend-url.railway.app

### 3. Update Configuration Files
- [ ] Update `netlify.toml` with backend URL
- [ ] Update `client/public/_redirects` with backend URL

### 4. Get Frontend URL
- [ ] Copy Netlify deployment URL (e.g., `https://your-app.netlify.app`)

## 🔄 Connect Frontend and Backend

### 1. Update CORS
- [ ] In Railway: Update CORS_ORIGIN to frontend URL
- [ ] In Netlify: Verify REACT_APP_API_URL is set to backend URL

### 2. Redeploy
- [ ] Railway will auto-redeploy
- [ ] Trigger manual deploy in Netlify

## 🧪 Testing

### 1. Backend Health Check
- [ ] Visit: `https://your-backend-url.railway.app/api/health`
- [ ] Should return: `{"success":true,"message":"Server is running"}`

### 2. Frontend Load
- [ ] Visit: `https://your-frontend-url.netlify.app`
- [ ] Should load MedicalGPT interface

### 3. Full Flow Test
- [ ] Create account
- [ ] Send test message
- [ ] Upload file (text/image)
- [ ] Check conversation history
- [ ] Test logout/login

## 🔒 Security Verification

- [ ] HTTPS enabled (automatic)
- [ ] CORS restricted to frontend domain
- [ ] Environment variables not exposed
- [ ] Rate limiting enabled
- [ ] JWT tokens working
- [ ] File upload size limits enforced

## 📊 Monitoring Setup

- [ ] Check Railway logs for errors
- [ ] Check Netlify build logs
- [ ] Monitor database connections
- [ ] Set up error alerts (optional)

## 🎉 Deployment Complete!

Your MedicalGPT app is now live at: `https://your-frontend-url.netlify.app`

### Next Steps
- [ ] Set up custom domain (optional)
- [ ] Configure monitoring alerts
- [ ] Set up backup strategies
- [ ] Share with users!

---

**Need help?** Check the full `DEPLOYMENT.md` guide for detailed instructions. 