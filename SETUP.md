# MedGPT Setup Guide - Deploy Immediately

## Step 1: Environment Configuration

Create a `.env` file in the root directory with the following content:

```env
# AI Provider Configuration
OPENAI_API_KEY=your_openai_api_key_here
AI_MODEL=gpt-4
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database Configuration
DATABASE_URL=./medgpt.db

# Security (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=medgpt-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=medgpt-super-secret-session-key-change-this-in-production
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/medgpt.log

# Medical Safety Configuration
SAFETY_ENABLED=true
TRIAGE_ENABLED=true
CITATION_ENABLED=true
EXPORT_ENABLED=true

# Analytics (Optional)
ANALYTICS_ENABLED=false
ANALYTICS_KEY=your_analytics_key_here
```

## Step 2: Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to "API Keys" section
4. Click "Create new secret key"
5. Copy the key and replace `your_openai_api_key_here` in your `.env` file

## Step 3: Install Dependencies

Run these commands in your terminal:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..
```

## Step 4: Initialize Database

```bash
# Initialize the SQLite database
npm run db:init
```

This will create:
- `medgpt.db` - SQLite database file
- All necessary tables (users, conversations, messages, etc.)
- Database indexes for performance

## Step 5: Start the Application

```bash
# Start both frontend and backend
npm run dev
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend on `http://localhost:3000`

## Step 6: Create Your First User

The application will be running, but you'll need to create a user account. You can either:

### Option A: Use the API directly
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password",
    "name": "Your Name"
  }'
```

### Option B: Add a test user to the database
```bash
# The database will be created automatically when you first run the app
# You can also manually add a user using SQLite:
sqlite3 medgpt.db
INSERT INTO users (email, password_hash, name) VALUES ('test@example.com', '$2a$12$...', 'Test User');
```

## Step 7: Test the Application

1. Open `http://localhost:3000` in your browser
2. You should see the MedGPT interface with:
   - Blue/red gradient sidebar
   - Chat window
   - Input bar at the bottom
   - Red disclaimer banner at the top

## Step 8: Make Your First Chat

1. Type a medical question in the input bar
2. Press Enter or click the send button
3. You should receive a response from the AI with:
   - Medical information
   - Safety disclaimers
   - Care level recommendations
   - Citations

## Production Deployment

### For Production, update your `.env`:

```env
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
JWT_SECRET=your-super-secure-jwt-secret-here
SESSION_SECRET=your-super-secure-session-secret-here
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

### Build for Production:

```bash
# Build the frontend
npm run build

# Start production server
npm start
```

## Troubleshooting

### Common Issues:

1. **"Module not found" errors**: Run `npm install` in both `server/` and `client/` directories
2. **Database errors**: Run `npm run db:init` to recreate the database
3. **OpenAI API errors**: Check your API key and billing status
4. **Port conflicts**: Change the PORT in `.env` if 3001 is already in use

### Check Logs:

```bash
# View server logs
tail -f logs/combined.log

# View error logs
tail -f logs/error.log
```

## Security Notes

- Change all secret keys in production
- Use HTTPS in production
- Consider using PostgreSQL instead of SQLite for production
- Set up proper firewall rules
- Enable rate limiting
- Monitor API usage and costs

## Next Steps

Once running, you can:
1. Add more users
2. Customize the medical prompts
3. Add more safety features
4. Integrate with external medical databases
5. Add voice input/output
6. Implement multi-language support

Your MedGPT is now ready to use! 🚀 