# 🚀 MedGPT Quick Start - Deploy in 5 Minutes

## Option 1: Automated Setup (Recommended)

```bash
# Run the automated setup script
./setup.sh
```

## Option 2: Manual Setup

### 1. Create .env file
Copy the content from `env.example` to `.env` and add your OpenAI API key.

### 2. Install dependencies
```bash
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 3. Initialize database
```bash
npm run db:init
```

### 4. Start the application
```bash
npm run dev
```

## Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up/login
3. Go to "API Keys"
4. Create new secret key
5. Add it to your `.env` file

## Test Your MedGPT

1. Open `http://localhost:3000`
2. Type a medical question
3. Get AI-powered medical guidance!

## Create Your First User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password",
    "name": "Your Name"
  }'
```

## Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

That's it! Your MedGPT is ready to use! 🎉

For detailed setup instructions, see `SETUP.md` 