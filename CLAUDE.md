# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack family management application built with:
- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, React Context for state management
- **Backend**: Node.js with Express.js REST API, JWT authentication, MongoDB with Mongoose
- **Database**: MongoDB with family-based multi-tenancy
- **Deployment**: Docker containerized development environment
- **AI Integration**: Ollama for meal planning suggestions

## Development Commands

### Docker Development (Primary)
```bash
# Start all services (preferred development method)
docker-compose up -d

# View logs from all services
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild services after changes
docker-compose up --build

# Access MongoDB shell
docker exec -it home-app-mongo mongosh -u admin -p password123 --authenticationDatabase admin
```

### Backend Commands (inside container)
```bash
# Development with auto-reload
npm run dev

# Production start
npm start

# Run tests
npm test

# Lint code
npm run lint
```

### Frontend Commands (inside container)
```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type checking
npm run type-check
```

## Architecture Overview

### Family-Based Multi-Tenancy
- Users belong to families identified by unique invite codes
- Family-scoped data isolation using middleware authentication
- Role-based permissions: admin, parent, child, guardian
- Shared features (calendar, grocery, chores) vs private features (todos, reminders)

### Backend Structure
- **models/**: Mongoose schemas for MongoDB documents
  - `Family.js`: Family management with invite codes and permissions
  - `User.js`: User authentication and profiles
  - Feature-specific models: `CalendarEvent.js`, `GroceryItem.js`, `Chore.js`, etc.
- **routes/**: Express.js API endpoints organized by feature
- **middleware/auth.js**: JWT authentication and family permission checking
- **config/database.js**: MongoDB connection configuration

### Frontend Architecture
- **App Router**: Next.js 14 app directory structure
- **Context Providers**: `AuthContext` for user/family state, `ThemeContext` for dark mode
- **Service Layer**: `api.ts` contains all backend communication logic
- **Component Organization**: Feature-based components with shared UI components in `/ui`
- **Custom Hooks**: Data fetching hooks (`useChores.ts`, `useFamilyMembers.ts`, etc.)

### Authentication Flow
1. User registers/logs in → receives JWT token
2. User creates family OR joins with invite code
3. Family membership determines access to shared features
4. Token must be included in all API requests via Authorization header

### Key Components
- **Dashboard.tsx**: Main application interface with tabbed navigation
- **Header.tsx**: Navigation bar with family info and quick actions
- Feature components: `ChoreBoard`, `Calendar`, `GroceryList`, `MealsToday`
- Modal components for data entry and management

## API Patterns

### Authentication Required
All API endpoints except `/auth/register` and `/auth/login` require JWT token in Authorization header:
```typescript
headers: { 'Authorization': `Bearer ${token}` }
```

### Family Context
Family-specific endpoints use middleware to ensure user belongs to family:
- `requireFamily`: Ensures user has familyId
- `requireFamilyPermission`: Checks specific permissions
- `requireFamilyAdmin`: Admin-only actions

### Response Format
Consistent API response structure:
```typescript
{
  message: string;
  data?: any;
  error?: string;
}
```

## Database Considerations

### Family Isolation
- All family-scoped documents include `familyId` field
- Use family middleware to automatically filter queries by family
- Consider family member limits and permissions when creating records

### MongoDB Indexes
- Family-based indexes on frequently queried collections
- User lookup indexes for authentication
- Date-based indexes for calendar and time-sensitive features

## Environment Configuration

### Required Environment Variables
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `OLLAMA_BASE_URL`: Ollama API endpoint for AI features
- `OLLAMA_MODEL`: Model name for AI meal planning
- `NEXT_PUBLIC_API_URL`: Backend API URL for frontend

## Development Notes

### State Management
- Use React Context for global state (auth, theme)
- Custom hooks for feature-specific data fetching
- Local state for UI-specific concerns

### Type Safety
- TypeScript interfaces defined inline in components
- API service methods are typed with request/response shapes
- Use Next.js built-in TypeScript support

### Styling Approach
- Tailwind CSS for utility-first styling
- Dark mode support via Tailwind's `dark:` prefix
- Glassmorphism design with backdrop-blur effects
- Responsive design with mobile-first approach

### AI Integration
- Ollama integration for meal planning suggestions
- AI responses formatted as structured data (ingredients, instructions, etc.)
- Error handling for AI service unavailability

## Testing and Linting

The project includes Jest for backend testing and ESLint for code linting. When making changes:
1. Run `npm run lint` in both frontend and backend
2. Run `npm test` in backend for API changes
3. Use `npm run type-check` in frontend for TypeScript validation