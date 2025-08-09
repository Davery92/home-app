# Home App - Family Management System

A comprehensive family management web application built with Next.js, Node.js, and MongoDB, designed for future iOS portability.

## 🚀 Features

### Shared Family Features
- **Family Calendar** - Collaborative event planning and scheduling
- **Grocery List** - Shared shopping lists with real-time updates  
- **Chore Board** - Task assignments with rewards and gamification
- **Meal Planning** - AI-powered meal suggestions using Ollama

### Private User Features
- **Personal Todo Lists** - Individual task management
- **Cleaning Schedule** - Personal cleaning routines
- **Reminders & Alerts** - Custom notifications
- **Medication Tracker** - Medicine scheduling and alerts
- **Water Tracker** - Daily hydration goals
- **Gift Idea Tracker** - Gift planning by person/occasion
- **Dog Vaccine Tracker** - Pet health management

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Node.js with Express.js REST API
- **Database**: MongoDB with Mongoose ODM  
- **Authentication**: JWT-based with family management
- **Deployment**: Docker containerized development environment
- **Future iOS Port**: Capacitor.js for native mobile app

## 🐳 Quick Start with Docker

1. **Clone and setup**:
   ```bash
   git clone <repo-url>
   cd home-app
   cp .env.example .env
   ```

2. **Start all services**:
   ```bash
   docker-compose up -d
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - MongoDB: localhost:27017

## 📁 Project Structure

```
home-app/
├── docker-compose.yml          # Docker services configuration
├── backend/                    # Node.js API server
│   ├── src/
│   │   ├── models/            # MongoDB schemas
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Auth & validation
│   │   └── config/           # Database connection
│   └── Dockerfile
├── frontend/                   # Next.js React app
│   ├── src/
│   │   ├── app/              # Next.js app router
│   │   ├── components/       # React components  
│   │   ├── hooks/           # Custom React hooks
│   │   └── utils/           # Utilities
│   └── Dockerfile
└── mongo-init.js              # MongoDB initialization
```

## 🔧 Development Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services  
docker-compose down

# Rebuild services
docker-compose up --build

# Access MongoDB shell
docker exec -it home-app-mongo mongosh -u admin -p password123 --authenticationDatabase admin

# Backend shell access
docker exec -it home-app-backend sh

# Frontend shell access  
docker exec -it home-app-frontend sh
```

## 🔐 Authentication & Family System

The app uses a family-based authentication system:

1. Users register individually
2. Create a new family OR join existing family with invite code
3. Family members have role-based permissions
4. Shared features work across family members
5. Private features are user-specific

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get user profile

### Family Management  
- `POST /api/families/create` - Create new family
- `POST /api/families/join` - Join family with invite code
- `GET /api/families` - Get family details

### Features (Coming Soon)
- `/api/calendar` - Calendar events
- `/api/grocery` - Grocery lists
- `/api/chores` - Chore management
- `/api/meals` - Meal planning with AI
- `/api/todos` - Personal todos
- `/api/reminders` - Personal reminders

## 🔮 Future iOS Development

The app is structured for easy iOS porting using Capacitor.js:

1. Progressive Web App (PWA) capabilities
2. Mobile-first responsive design
3. Offline functionality with local storage
4. Native device feature integration ready
5. App Store deployment configuration

## 📝 Environment Variables

Copy `.env.example` to `.env` and configure:

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret  
- `OLLAMA_BASE_URL` - Ollama endpoint URL
- `OLLAMA_MODEL` - Ollama model name for AI meal planning
- `NEXT_PUBLIC_API_URL` - Backend API URL

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)  
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.