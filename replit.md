# Tapestry: Intelligent Design Matchmaking

## Overview

Tapestry is a proof-of-concept web application that serves as an intelligent design matchmaking platform. It helps users discover, organize, and connect with talented designers through AI-powered recommendations and curated talent directories. The application features user authentication, workspace management, designer profiles, AI-powered matching, and collaborative list creation.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom serif typography (Crimson Text)
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with local strategy and session-based auth
- **Database ORM**: Drizzle ORM with PostgreSQL
- **File Handling**: Multer for multipart form data
- **Image Processing**: Sharp for image optimization

### Design System
- **Theme**: Professional warm color palette with gold (#C8944B) primary color
- **Typography**: Serif-first design using Crimson Text font family
- **Layout**: Minimal border radius (flat design) with focus on typography and whitespace

## Key Components

### Authentication System
- Session-based authentication using express-session
- User registration with workspace creation
- Password hashing using Node.js crypto scrypt
- Protected routes with role-based access control

### Designer Management
- CRUD operations for designer profiles
- Skills management with autocomplete functionality
- Profile enrichment using AI (OpenAI/Anthropic)
- Bulk import from CSV and PDF sources
- Image upload and processing for profile photos

### AI Matchmaking
- OpenAI-powered role analysis and designer recommendations
- Conversation system for iterative matching refinement
- Confidence scoring and reasoning for recommendations
- Skills matching and concern identification

### Workspace System
- Multi-tenant architecture with workspace isolation
- Role-based permissions (owner, admin, member)
- Invitation system with email notifications
- Slug-based workspace routing

### List Management
- Curated designer lists with sharing capabilities
- Public and private list visibility
- Email sharing with SendGrid integration
- Collaborative list building

### Hiring Feature
- Job posting creation with markdown editor support
- AI-powered designer matching using OpenAI GPT-4
- Job management interface with status tracking
- Designer recommendations with confidence scoring and reasoning
- Skills-based matching with concern identification

## Data Flow

### User Journey
1. User registers and creates workspace
2. Onboarding flow introduces key features
3. User adds designers to directory (manual, CSV, or AI-enriched)
4. AI matchmaker analyzes requirements and suggests designers
5. User creates lists from recommendations
6. Lists can be shared via email or public links

### Data Processing
- Form data validation using Zod schemas
- Image uploads processed and stored in Replit Object Storage
- CSV/PDF parsing for bulk designer imports
- AI enrichment pipeline for profile enhancement
- Email delivery through SendGrid API

## External Dependencies

### Third-Party Services
- **SendGrid**: Email delivery for invitations and list sharing
- **OpenAI**: AI-powered matching and profile enrichment
- **Anthropic**: Alternative AI provider for enrichment
- **Replit Object Storage**: File and image storage
- **Replit Database**: PostgreSQL database hosting

### Development Tools
- **Replit**: Primary development and hosting environment
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Production build optimization
- **Drizzle Kit**: Database migrations and schema management

## Deployment Strategy

### Development Environment
- Replit-based development with hot reloading
- Vite development server with Express API proxy
- Memory-based session storage for development
- Environment variables for API keys and database URLs

### Production Considerations
- Static asset serving with cache headers
- Helmet.js security middleware
- Production session storage recommendations
- Database connection pooling with Drizzle
- Error handling and logging

### Build Process
- Frontend: Vite build with TypeScript compilation
- Backend: ESBuild bundling for Node.js deployment
- Database: Drizzle schema push for migrations
- Assets: Optimized image serving and caching

## Authentication Implementation

### Login Modal System
- **Status**: ✅ WORKING - DO NOT REWRITE
- **Implementation**: Custom modal overlay (not Radix Dialog)
- **Location**: `client/src/components/Navigation.tsx` and `client/src/pages/AuthPage.tsx`
- **Key Features**:
  - Custom modal with inline styles to prevent CSS conflicts
  - Auto-dismiss on successful authentication
  - Event-driven close mechanism
  - Mobile/desktop responsive design
  - Simple HTML form elements (not react-hook-form)

### Critical Implementation Details
- Uses custom overlay instead of Radix Dialog components
- All styling done with inline styles to avoid CSS inheritance issues
- Event listener pattern for modal closure: `window.dispatchEvent(new CustomEvent('closeAuthModal'))`
- Authentication flow triggers modal close via useEffect in Navigation component

### Future Maintenance
- ⚠️ **DO NOT rewrite authentication modal components**
- ⚠️ **DO NOT replace with different modal libraries**
- ⚠️ **DO NOT change from inline styles to CSS classes**
- Minor UX improvements only - major rewrites prohibited

## Changelog
- June 27, 2025. Initial setup
- June 27, 2025. Fixed login modal visibility and auto-dismiss UX
- June 27, 2025. Implemented Hiring feature with job creation, AI matching, and database optimization

## User Preferences

Preferred communication style: Simple, everyday language.
Cost-conscious: Avoid unnecessary rewrites of working components.