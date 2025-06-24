# MedGPT - Medical AI Assistant

A web-based conversational medical assistant that provides instant, reliable, and safe medical guidance using AI technology.

## Features

- **Chat Interface**: Clean, ChatGPT-style interface with dark/light mode
- **Medical Knowledge**: Powered by medical literature and clinical guidelines
- **Safety Features**: Built-in safety guardrails and medical disclaimers
- **Citation System**: Structured citations to medical sources
- **Session Export**: Export conversations for doctor visits
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, TypeScript
- **Backend**: Node.js with Express
- **AI**: OpenAI GPT-4 API (configurable for other models)
- **Database**: SQLite (for development), PostgreSQL (for production)
- **Deployment**: Docker support for easy deployment

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (or other compatible AI provider)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MedicalGPT
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # AI Provider Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   AI_MODEL=gpt-4
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   
   # Database (SQLite for development)
   DATABASE_URL=./medgpt.db
   
   # Security
   JWT_SECRET=your_jwt_secret_here
   SESSION_SECRET=your_session_secret_here
   ```

4. **Initialize the database**
   ```bash
   npm run db:init
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
MedicalGPT/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   └── database/          # Database migrations and seeds
├── shared/                # Shared types and utilities
└── docs/                  # Documentation
```

## Development

### Available Scripts

- `npm run dev` - Start development server (frontend + backend)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:init` - Initialize database
- `npm run db:migrate` - Run database migrations
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

### Development Workflow

1. **Frontend Development**: Edit files in `client/src/`
2. **Backend Development**: Edit files in `server/src/`
3. **Database Changes**: Create migrations in `server/database/migrations/`
4. **API Testing**: Use the built-in API documentation at `/api/docs`

## Safety Features

MedGPT includes several safety measures:

- **Medical Disclaimers**: Clear warnings that this is not a substitute for professional medical care
- **Triage Recommendations**: Suggests appropriate care levels (self-care, urgent care, emergency)
- **Content Filtering**: Blocks requests for controlled substances or harmful instructions
- **Citation System**: Provides sources for medical information
- **Session Logging**: Tracks conversations for quality improvement

## Deployment

### Docker Deployment

1. **Build the Docker image**
   ```bash
   docker build -t medgpt .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:3000 -e OPENAI_API_KEY=your_key medgpt
   ```

### Production Deployment

1. **Set up environment variables for production**
2. **Configure a production database (PostgreSQL recommended)**
3. **Set up reverse proxy (nginx)**
4. **Configure SSL certificates**
5. **Set up monitoring and logging**

## API Documentation

The API documentation is available at `/api/docs` when running the server.

### Key Endpoints

- `POST /api/chat` - Send a message and get AI response
- `GET /api/conversations` - Get conversation history
- `POST /api/export` - Export conversation as PDF
- `GET /api/health` - Health check endpoint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

**IMPORTANT**: MedGPT is designed to provide general medical information and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for medical concerns.

## Support

For support, please open an issue in the GitHub repository or contact the development team.