# 🚀 MedicalGPT Deployment Guide

This guide will help you deploy MedicalGPT to production using Netlify (frontend) and Railway (backend).

## 📋 Prerequisites

- GitHub account
- Netlify account (free)
- Railway account (free tier available)
- OpenAI API key
- PostgreSQL database (provided by Railway)

## 🔐 Security Keys Generated

Use these generated keys in your production environment:

```bash
JWT_SECRET=5058fbce53aa8fe2c4eff2e9fad122291e90670f2b39c125294649d373ac8f7e9299c2138923383c71fe376c993f9f10f2425da3509e4216885f20bfc7d85f70

SESSION_SECRET=54a5b5cad94c1bd2badbba21c20f941174d23e283e6b787c472d4f70fef975a465f0eb6f1d88927b4fbedbf11e21318ba0a9e46faf3a84f25e27a5d0062ef295

ENCRYPTION_KEY=21e45259360681fcf61d7fafd43000e95accc34ca4da92a15a6b04542f18673b
```

## 🗄️ Step 1: Deploy Backend to Railway

### 1.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create a new project

### 1.2 Deploy Backend
1. In Railway dashboard, click "Deploy from GitHub repo"
2. Select your MedicalGPT repository
3. Set the root directory to `server`
4. Railway will automatically detect it's a Node.js app

### 1.3 Add PostgreSQL Database
1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will create a PostgreSQL database
4. Copy the connection string (DATABASE_URL)

### 1.4 Configure Environment Variables
In Railway dashboard, go to your backend service → Variables tab and add:

```bash
# AI Configuration
OPENAI_API_KEY=your_openai_api_key_here
AI_MODEL=gpt-3.5-turbo
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7

# Server Configuration
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.netlify.app

# Database (use the connection string from Railway)
DATABASE_URL=postgresql://username:password@host:port/database_name

# Security (use the generated keys above)
JWT_SECRET=5058fbce53aa8fe2c4eff2e9fad122291e90670f2b39c125294649d373ac8f7e9299c2138923383c71fe376c993f9f10f2425da3509e4216885f20bfc7d85f70
SESSION_SECRET=54a5b5cad94c1bd2badbba21c20f941174d23e283e6b787c472d4f70fef975a465f0eb6f1d88927b4fbedbf11e21318ba0a9e46faf3a84f25e27a5d0062ef295
ENCRYPTION_KEY=21e45259360681fcf61d7fafd43000e95accc34ca4da92a15a6b04542f18673b

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Medical Safety
SAFETY_ENABLED=true
TRIAGE_ENABLED=true
CITATION_ENABLED=true
EXPORT_ENABLED=true
```

### 1.5 Get Backend URL
1. After deployment, Railway will provide a URL like: `https://your-app-name.railway.app`
2. Copy this URL - you'll need it for the frontend

## 🌐 Step 2: Deploy Frontend to Netlify

### 2.1 Create Netlify Account
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "New site from Git"

### 2.2 Deploy Frontend
1. Connect your GitHub repository
2. Set build settings:
   - **Build command**: `cd client && npm install && npm run build`
   - **Publish directory**: `client/build`
   - **Base directory**: (leave empty)

### 2.3 Configure Environment Variables
In Netlify dashboard → Site settings → Environment variables, add:

```bash
REACT_APP_API_URL=https://your-backend-url.railway.app
```

### 2.4 Update Configuration Files
1. Update `netlify.toml` with your actual backend URL
2. Update `client/public/_redirects` with your actual backend URL

### 2.5 Get Frontend URL
1. Netlify will provide a URL like: `https://your-app-name.netlify.app`
2. Copy this URL - you'll need it for the backend CORS configuration

## 🔄 Step 3: Connect Frontend and Backend

### 3.1 Update Backend CORS
In Railway dashboard, update the `CORS_ORIGIN` variable:
```bash
CORS_ORIGIN=https://your-frontend-url.netlify.app
```

### 3.2 Update Frontend API URL
In Netlify dashboard, update the `REACT_APP_API_URL` variable:
```bash
REACT_APP_API_URL=https://your-backend-url.railway.app
```

### 3.3 Redeploy Both Services
1. Railway will automatically redeploy when you change environment variables
2. In Netlify, trigger a manual deploy after changing environment variables

## 🗄️ Step 4: Database Setup

### 4.1 Initialize Database
Railway will automatically create the PostgreSQL database, but you need to run migrations:

1. In Railway dashboard, go to your backend service
2. Click on "Deployments" tab
3. Find the latest deployment and click "View logs"
4. Check if database initialization completed successfully

If you need to manually run database setup:
1. In Railway dashboard, go to your backend service
2. Click "Settings" → "Custom Domains"
3. Add a custom domain or use the provided URL
4. Access the health endpoint: `https://your-backend-url.railway.app/api/health`

## 🧪 Step 5: Testing

### 5.1 Test Backend
Visit: `https://your-backend-url.railway.app/api/health`
Should return: `{"success":true,"message":"Server is running"}`

### 5.2 Test Frontend
Visit: `https://your-frontend-url.netlify.app`
Should load the MedicalGPT interface

### 5.3 Test Full Flow
1. Create an account
2. Send a test message
3. Upload a file
4. Check if everything works

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure `CORS_ORIGIN` in backend matches your frontend URL exactly
2. **Database Connection**: Check Railway logs for database connection errors
3. **Environment Variables**: Ensure all variables are set correctly in both platforms
4. **Build Errors**: Check Netlify build logs for any missing dependencies

### Logs:
- **Railway**: Go to your service → Deployments → View logs
- **Netlify**: Go to your site → Deployments → View deploy log

## 📊 Monitoring

### Railway Monitoring:
- Go to your service → Metrics tab
- Monitor CPU, memory, and network usage
- Check deployment logs for errors

### Netlify Monitoring:
- Go to your site → Analytics tab
- Monitor page views and performance
- Check form submissions and functions

## 🔒 Security Checklist

- [ ] JWT_SECRET is set and secure
- [ ] SESSION_SECRET is set and secure
- [ ] ENCRYPTION_KEY is set and secure
- [ ] CORS_ORIGIN is restricted to your frontend domain
- [ ] Rate limiting is enabled
- [ ] HTTPS is enabled (automatic on both platforms)
- [ ] Environment variables are not exposed in client code

## 💰 Cost Estimation

### Railway (Free Tier):
- $5/month for 500 hours of usage
- PostgreSQL database included
- Automatic scaling

### Netlify (Free Tier):
- 100GB bandwidth/month
- 300 build minutes/month
- Custom domains included

## 🚀 Next Steps

1. Set up custom domains (optional)
2. Configure SSL certificates (automatic)
3. Set up monitoring and alerts
4. Configure backup strategies
5. Set up CI/CD pipelines

## 📞 Support

If you encounter issues:
1. Check the logs in both Railway and Netlify
2. Verify all environment variables are set correctly
3. Ensure database is properly initialized
4. Test locally first to isolate issues

---

**Your MedicalGPT app is now live!** 🎉

Users can access it at: `https://your-frontend-url.netlify.app` 