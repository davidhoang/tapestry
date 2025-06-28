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
- Comprehensive role-based permissions system with 5 roles:
  - **Admin**: The main admin account (david@davidhoang.com) with full application access
  - **Owner**: Users who create accounts and maintain their personal workspace with full workspace control
  - **Editor**: Users added to a workspace with edit access granted by the Owner (enhanced member permissions)
  - **Member**: Users added to a workspace with limited access (view designers, use AI matchmaker, restricted from lists/hiring)
  - **Viewer**: Read-only access to workspace content
- Advanced permission enforcement with 25+ granular permissions across:
  - Designer Management (create, edit, delete, view, export, import, bulk operations)
  - List Management (create, edit, delete, view, share, publish)
  - Hiring & Jobs (create, edit, delete, view, manage candidates, AI matching)
  - Workspace Management (invite, remove members, change roles, settings)
  - Data & Analytics (access analytics, export data, audit logs)
  - AI Features (use enrichment, configure AI settings)
  - Billing & Admin (manage billing, view usage)
- Server-side permission middleware for API endpoint protection
- Audit logging for permission-based actions
- Invitation system with email notifications and role assignment
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

## Modal Positioning System

### Dialog Components
- **Status**: ✅ WORKING - DO NOT REWRITE
- **Implementation**: Radix UI Dialog with custom positioning
- **Location**: `client/src/components/ui/dialog.tsx` and `client/src/components/ui/alert-dialog.tsx`
- **Key Features**:
  - Proper center positioning using `left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]`
  - Consistent modal placement across desktop, tablet, and mobile
  - Enhanced CSS rules in `client/src/index.css` for Radix dialog components

### Critical Implementation Details
- Uses standard CSS transform positioning for reliable centering
- Enhanced CSS targeting `[data-radix-dialog-content]` ensures proper positioning
- Simplified class structure prevents corner positioning issues
- Safe permissions checking with optional chaining (`permissions?.canAccessNotes`)

### Future Maintenance
- ⚠️ **DO NOT rewrite dialog positioning CSS**
- ⚠️ **DO NOT change back to complex responsive positioning**
- ⚠️ **DO NOT remove enhanced CSS rules for Radix components**
- Modal positioning tested and working across all screen sizes

## Changelog
- June 27, 2025. Initial setup
- June 27, 2025. Fixed login modal visibility and auto-dismiss UX
- June 27, 2025. Implemented Hiring feature with job creation, AI matching, and database optimization
- June 28, 2025. Fixed workspace access issues for all alpha users by creating personal workspaces
- June 28, 2025. Implemented comprehensive workspace invitation system with token-based flow
- June 28, 2025. Fixed workspace loading issue in settings page by adding missing /api/workspaces endpoint
- June 28, 2025. Fixed modal positioning issues - all dialogs now properly center on desktop, tablet, and mobile
- June 28, 2025. Enhanced invitation system: allows multiple invitations to same email, graceful duplicate account handling, and auto-acceptance of pending invitations
- June 28, 2025. Implemented comprehensive role-based permission system with 25+ granular permissions, server-side middleware enforcement, audit logging, and workspace member management interface
- June 28, 2025. Updated Member role permissions: restricted access to lists and hiring by default, retained directory, matchmaker, and designer creation access
- June 28, 2025. Completed comprehensive permission enforcement: Members properly blocked from Lists API ("Permission denied: Cannot view lists"), while maintaining full access to Designer Directory, AI Matchmaker, and designer creation capabilities
- June 28, 2025. Implemented workspace switching in profile dropdown: users can seamlessly switch between workspaces they have access to, with role indicators and current workspace highlighting
- June 28, 2025. Updated home navigation link: "Tapestry" logo now routes authenticated users to their current workspace directory instead of admin page, creating more intuitive navigation flow
- June 28, 2025. Added visual feedback for workspace switching: toast notifications appear when users switch workspaces, showing "My Workspace" for owned workspaces and actual names for collaborative ones, providing clear context for the fast transition
- June 28, 2025. Implemented comprehensive workspace management in profile settings: users can view all workspace memberships with role indicators, leave non-owned workspaces with confirmation dialogs, and backend API with owner protection and audit logging
- June 28, 2025. Fixed critical workspace data isolation bug: resolved cross-workspace data leakage where users were seeing designers from other workspaces, implemented proper workspace context extraction from URL headers, added complete cache clearing on workspace switching, and workspace-based image cache-busting to prevent thumbnail cross-contamination. Root cause: DirectoryPage was using wrong hook file (use-designer.ts vs use-designers.ts), fixed by consolidating into single hook with workspace context extraction
- June 28, 2025. Implemented sentence case styling for all buttons across the application, replacing uppercase text transformations with proper capitalization
- June 28, 2025. Fixed AI matchmaker functionality: resolved workspace context extraction issues in /api/jobs/matches endpoint, added comprehensive error handling and OpenAI API key validation, corrected syntax errors in nested try-catch blocks. Users can now successfully use "Find Matches" feature with proper workspace isolation
- June 28, 2025. Cleaned up job card UI design: removed draft badges, creation dates, and "Find Matches" buttons from job cards for cleaner, simpler interface focused on job titles and descriptions
- June 28, 2025. Repositioned "Find Matches" button to job details section header for better workflow integration - users can now trigger AI matching directly from the job description area
- June 28, 2025. Confirmed hiring feature fully functional: AI matchmaker working with 20-second analysis times, proper workspace isolation, clean UI design, and intuitive user workflow
- June 28, 2025. Added attached_assets to .gitignore to keep development screenshots in Replit while excluding them from GitHub repository
- June 28, 2025. Fixed Lists API workspace context extraction: updated POST and GET /api/lists endpoints to use same workspace detection pattern as jobs and designers, resolving "Workspace ID required" error when creating lists
- June 28, 2025. Completed Lists API workspace isolation: updated all list hooks (useLists, useCreateList, useUpdateList, useDeleteList) to extract workspace context from URL and send x-workspace-slug headers, ensuring proper workspace data isolation across all list operations
- June 28, 2025. Fixed critical workspace assignment bug: resolved issue where users creating designers were assigned to invited workspaces instead of their default workspace. Updated getUserWorkspace functions to prioritize by role (owner > admin > member > viewer) then by earliest joined date, ensuring users create content in their personal workspaces by default
- June 28, 2025. Implemented Editor role in permission system: added new role type between Admin and Member with full content access but limited workspace management permissions. Updated role hierarchy to owner > admin > editor > member > viewer for proper workspace selection priority
- June 28, 2025. Implemented comprehensive RLHF (Reinforcement Learning from Human Feedback) system: created recommendation_feedback database table, feedback collection modal with 5 feedback types (good_match, irrelevant_experience, under_qualified, over_qualified, location_mismatch), analytics dashboard with success rate tracking, enhanced AI recommendation endpoint that learns from historical feedback patterns, integrated feedback buttons into hiring page recommendation cards, and feedback analytics page with trend analysis and insights
- June 28, 2025. Extended RLHF feedback system to Intelligent Matching page: added thumbs up/down icons with smart pre-selection, integrated RecommendationFeedbackModal with job context, implemented consistent feedback UI across both hiring and matchmaker workflows, enabling comprehensive learning from user interactions across all AI recommendation touchpoints
- June 28, 2025. Moved RLHF Analytics dashboard from hiring page to admin section: relocated FeedbackAnalyticsDashboard component to admin panel as dedicated tab, providing centralized access to feedback analytics and system insights for administrative users
- June 28, 2025. Implemented AI System Prompt Configuration: created ai_system_prompts database table, built comprehensive admin interface for creating/editing/managing custom AI prompts, integrated custom prompts into AI matching system with {feedbackInsights} placeholder injection, added workspace-specific prompt management with activation controls, enabling administrators to customize AI behavior and improve matching quality through tailored system instructions

## User Preferences

Preferred communication style: Simple, everyday language.
Cost-conscious: Avoid unnecessary rewrites of working components.
Button styling: All buttons should use sentence case instead of all capitals.