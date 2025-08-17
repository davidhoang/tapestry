# Tapestry: Intelligent Design Matchmaking

## Overview
Tapestry is an intelligent design matchmaking platform that connects users with talented designers through AI-powered recommendations and curated directories. It offers features like user authentication, workspace management, designer profiles, AI-driven matching, and collaborative list creation. The project aims to streamline the process of discovering and hiring designers, leveraging AI to enhance efficiency and accuracy in talent acquisition.

## User Preferences
Preferred communication style: Simple, everyday language.
Cost-conscious: Avoid unnecessary rewrites of working components.
Button styling: All buttons should use sentence case instead of all capitals.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with Crimson Text typography
- **UI Components**: Radix UI primitives with shadcn/ui
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js (local strategy, session-based)
- **Database ORM**: Drizzle ORM with PostgreSQL
- **File Handling**: Multer
- **Image Processing**: Sharp

### Design System
- **Theme**: Professional warm color palette with gold primary color
- **Typography**: Serif-first design using Crimson Text
- **Layout**: Minimal border radius (flat design) with focus on typography and whitespace

### Key Features
- **Authentication System**: Session-based, user registration, password hashing, protected routes with role-based access control. Custom authentication modal is a critical, unchangeable component.
- **Designer Management**: CRUD operations, skills management, AI enrichment (OpenAI/Anthropic), bulk import, image upload.
- **AI Matchmaking**: OpenAI-powered role analysis, iterative refinement, confidence scoring, skills matching. Includes a Reinforcement Learning from Human Feedback (RLHF) system for continuous improvement.
- **Workspace System**: Multi-tenant architecture with isolation, comprehensive role-based permissions (Admin, Owner, Editor, Member), granular permissions (25+), server-side enforcement, audit logging, invitation system, slug-based routing. The system has robust workspace switching and management features.
- **List Management**: Curated designer lists, sharing capabilities (public/private), email sharing (SendGrid), collaborative building.
- **Hiring Feature**: Job posting, AI-powered designer matching, job management, status tracking.
- **Recruiting Board**: Visual kanban board for tracking designers through recruitment pipeline. Features drag-and-drop functionality, customizable columns (default: Backlog, Outreach, Interviewing, Offer, Hired), bulk designer import from lists or directory, notes tracking. Built with @dnd-kit for smooth drag-and-drop experience.
- **Modal Positioning System**: Uses Radix UI Dialog with custom CSS for consistent, reliable centering across devices. This system is stable and should not be rewritten.

## External Dependencies

### Third-Party Services
- **SendGrid**: Email delivery for invitations and list sharing.
- **OpenAI**: AI-powered matching and profile enrichment.
- **Anthropic**: Alternative AI provider for enrichment.
- **Replit Object Storage**: File and image storage.
- **Replit Database**: PostgreSQL database hosting.

### Development Tools
- **Replit**: Primary development and hosting environment.
- **TypeScript**: Type safety across frontend and backend.
- **ESBuild**: Production build optimization.
- **Drizzle Kit**: Database migrations and schema management.