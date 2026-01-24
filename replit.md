# Tapestry: Intelligent Design Matchmaking

## Overview
Tapestry is an intelligent design matchmaking platform designed to connect users with talented designers using AI-powered recommendations and curated directories. The platform offers features such as user authentication, workspace management, comprehensive designer profiles, AI-driven matching, and collaborative list creation. Its core purpose is to streamline the discovery and hiring of designers, leveraging artificial intelligence to enhance efficiency and accuracy in talent acquisition.

## User Preferences
Preferred communication style: Simple, everyday language.
Cost-conscious: Avoid unnecessary rewrites of working components.
Button styling: All buttons should use sentence case instead of all capitals.
No emojis: Never use emojis in the UI or code - the user strongly dislikes them.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with Crimson Text typography
- **UI Components**: Radix UI primitives with shadcn/ui
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod validation
- **Rich Text Editor**: TipTap (ProseMirror-based) with DOMPurify

### Backend
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js (local, session-based) for web, JWT for mobile APIs
- **Database ORM**: Drizzle ORM with PostgreSQL
- **File Handling**: Multer
- **Image Processing**: Sharp

### Design System
- **Theme**: Professional warm color palette with gold primary color, serif-first typography (Crimson Text), and softer border radius (0.75).
- **Mobile Optimization**: Designed for iPhone 17 (393pt width) with 18px base font, softer card shadows, direct sign-in for logged-out users, 44px minimum touch targets, iOS input zoom prevention, and bottom tab navigation.
- **Modal Design System**: Standardized spacing and sizing for all dialogs, including `h-11` height for inputs, `space-y-2` for labels, `space-y-6` for form sections, `resize-none` for textareas, and responsive grid layouts.

### Key Features
- **Authentication System**: Session-based with user registration, password hashing, protected routes, and role-based access control.
- **Designer Management**: CRUD operations, skills management, AI enrichment, and bulk import/export.
- **AI Matchmaking**: OpenAI-powered role analysis, iterative refinement, confidence scoring, and skills matching with an RLHF system.
- **Workspace System**: Multi-tenant architecture with role-based permissions (Admin, Owner, Editor, Member), granular permissions, server-side enforcement, audit logging, and invitation system.
- **List Management**: Curated designer lists with sharing capabilities (public/private) and collaborative building.
- **Hiring Feature**: Job posting, AI-powered designer matching, and status tracking.
- **Recruiting Board**: Visual kanban board with drag-and-drop functionality for tracking designers through the recruitment pipeline.
- **Recommendations Home**: Provides daily AI-driven suggestions for designer recommendations and outreach, using location-based suggestions and RLHF feedback.
- **Saved Searches**: Allows users to save and reuse search filters (skill, title, location).
- **Activity Feed**: Tracks workspace activity with cursor-based pagination.
- **Command Palette**: Keyboard-accessible navigation for quick actions.
- **Bulk Actions**: Multi-select and bulk operations on designers.
- **MCP Designer Enrichment**: Integration for AI-assisted profile enrichment via external AI tools, supporting token-based authentication and various enrichment tools.
- **Public API**: REST API with JWT authentication for mobile apps and external integrations. Includes rate limiting (500 requests per 15 min per IP).
- **MCP Server**: Remote Model Context Protocol server at `/mcp` for AI assistants like Claude Desktop. Users can self-service API tokens via Settings > API Tokens page.

## External Dependencies

### Third-Party Services
- **Resend**: Email delivery.
- **OpenAI**: AI-powered matching and profile enrichment.
- **Anthropic**: Alternative AI provider for enrichment.
- **Replit Object Storage**: File and image storage.
- **Replit Database**: PostgreSQL database hosting.

### Development Tools
- **Replit**: Primary development and hosting environment.
- **TypeScript**: Type safety across frontend and backend.
- **ESBuild**: Production build optimization.
- **Drizzle Kit**: Database migrations and schema management.