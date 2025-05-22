# School Management System

## Overview

This is a school management system application with a React frontend and Express backend. The application allows administrators, teachers, coordinators, and students to manage various aspects of a school including students, classes, grades, attendance, and calendar events.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

- **Framework**: React with TypeScript
- **Routing**: Wouter for lightweight routing
- **State Management**: React Query for server state
- **UI Components**: Shadcn UI component library (based on Radix UI)
- **Styling**: Tailwind CSS with a custom theme
- **Build Tool**: Vite

### Backend

- **Framework**: Express.js on Node.js
- **API**: RESTful API endpoints
- **Authentication**: Replit Auth using OpenID Connect
- **Session Management**: Express-session with PostgreSQL session store

### Database

- **Database**: PostgreSQL (via Neon Serverless)
- **ORM**: Drizzle ORM for database operations
- **Schema Validation**: Zod integrated with Drizzle

### Authentication

- **Provider**: Replit Auth
- **Strategy**: OpenID Connect (OIDC)
- **Session Storage**: PostgreSQL sessions table

## Key Components

### Frontend Components

1. **Layout Structure**
   - `MainLayout`: Main application layout with sidebar navigation
   - Page-specific components (Dashboard, Students, Teachers, etc.)

2. **UI Components**
   - Comprehensive set of Shadcn UI components
   - Role-specific dashboard views
   - Data tables for various entities
   - Forms for data entry and editing

3. **Authentication**
   - Login page with Replit Auth integration
   - Authentication state management using React Query
   - Protected routes based on authentication status

### Backend Components

1. **API Routes**
   - Authentication endpoints
   - CRUD operations for users, classes, subjects, grades, etc.
   - Role-based access control

2. **Database Models**
   - Users (with roles: admin, coordinator, teacher, student)
   - Classes
   - Subjects
   - Grades
   - Attendance
   - Events
   - Notifications

3. **Storage Layer**
   - Interface for all database operations
   - Methods for retrieving and manipulating data

## Data Flow

1. **Authentication Flow**
   - User authenticates via Replit Auth
   - Server validates token and creates/updates user in database
   - Session is created and stored in PostgreSQL
   - User information is sent to frontend

2. **Data Access Flow**
   - Frontend requests data from backend via React Query
   - Backend validates user session and permissions
   - Backend retrieves data from PostgreSQL via Drizzle ORM
   - Data is transformed and sent back to frontend
   - Frontend displays data and allows manipulation based on user role

3. **Data Update Flow**
   - User submits form with updates
   - Frontend sends data to backend API
   - Backend validates input using Zod schemas
   - Database is updated via Drizzle ORM
   - Success/error response is sent back to frontend
   - UI is updated with toast notifications

## External Dependencies

### Frontend Dependencies

- `@radix-ui/*`: UI component primitives
- `@tanstack/react-query`: Data fetching and caching
- `class-variance-authority`: Component styling variants
- `date-fns`: Date manipulation
- `lucide-react`: Icon library
- `wouter`: Routing
- `tailwindcss`: Utility-first CSS framework
- `shadcn/ui`: Component library (implemented directly in codebase)

### Backend Dependencies

- `express`: Web server framework
- `openid-client`: Authentication library for Replit Auth
- `drizzle-orm`: Database ORM
- `@neondatabase/serverless`: PostgreSQL client for Neon DB
- `connect-pg-simple`: PostgreSQL session store
- `zod`: Schema validation

## Deployment Strategy

The application is configured for deployment on Replit with:

1. **Development Mode**
   - Run with `npm run dev` command
   - Vite development server with HMR
   - Runtime error overlay for debugging

2. **Production Build**
   - Build frontend with Vite
   - Bundle server with esbuild
   - Serve static assets from Express

3. **Database Setup**
   - PostgreSQL database provisioned by Replit
   - Tables created via Drizzle migrations
   - Database schema defined in `shared/schema.ts`

4. **Environment Variables**
   - `DATABASE_URL`: PostgreSQL connection string
   - `SESSION_SECRET`: Secret for session encryption
   - `REPLIT_DOMAINS`: Replit domains for authentication
   - `ISSUER_URL`: OpenID Connect issuer URL

## Development Workflow

1. Start the development server with `npm run dev`
2. Make database schema changes in `shared/schema.ts`
3. Push schema changes to database with `npm run db:push`
4. Add new API endpoints in `server/routes.ts`
5. Create new frontend pages in `client/src/pages/`
6. Update UI components as needed from the existing Shadcn UI library

## Known Limitations

1. The application currently uses mock data in many frontend components
2. Some database schema entities are defined but not fully implemented
3. The database schema may need to be expanded for additional features