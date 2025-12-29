# Tapestry: Intelligent Design Matchmaking

## Overview
Tapestry is an intelligent design matchmaking platform that connects users with talented designers through AI-powered recommendations and curated directories. It offers features like user authentication, workspace management, designer profiles, AI-driven matching, and collaborative list creation. The project aims to streamline the process of discovering and hiring designers, leveraging AI to enhance efficiency and accuracy in talent acquisition.

## User Preferences
Preferred communication style: Simple, everyday language.
Cost-conscious: Avoid unnecessary rewrites of working components.
Button styling: All buttons should use sentence case instead of all capitals.
No emojis: Never use emojis in the UI or code - the user strongly dislikes them.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with Crimson Text typography
- **UI Components**: Radix UI primitives with shadcn/ui
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite
- **Rich Text Editor**: TipTap (ProseMirror-based) with DOMPurify sanitization for security

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js (local strategy, session-based)
- **Database ORM**: Drizzle ORM with PostgreSQL
- **File Handling**: Multer
- **Image Processing**: Sharp

### Design System
- **Theme**: Professional warm color palette with gold primary color
- **Typography**: Serif-first design using Crimson Text
- **Layout**: Softer border radius (0.75) with focus on typography and whitespace
- **Mobile Optimization** (December 2025):
  - Target device: iPhone 17 (393pt width)
  - 17px base font on mobile for better readability
  - Softer card shadows (shadow-sm) with subtle borders (border-gray-100)
  - Direct "Sign in" button on mobile for logged-out users (no hamburger menu)
  - Larger touch targets (44px+) for checkboxes and interactive elements
  - iOS input zoom prevention (16px minimum font size)
  - Typography overrides scoped to .prose/.article to preserve badge/status styling
- **Modal Design System**: Comprehensive spacing and sizing standards for all dialog modals:
  - Base dialog: max-h-[calc(100vh-4rem)] with my-8 margins for proper viewport fitting
  - Form controls: h-11 height for all Input and SelectTrigger components
  - Textareas: resize-none to prevent manual resizing
  - Field spacing: space-y-2 for label-input pairs, space-y-6 for form sections
  - Responsive layouts: grid-cols-1 md:grid-cols-2 with gap-5 for multi-field forms
  - Enhanced keyboard ergonomics: Escape dismissal, smooth tab navigation

### Key Features
- **Authentication System**: Session-based, user registration, password hashing, protected routes with role-based access control. Custom authentication modal is a critical, unchangeable component.
- **Designer Management**: CRUD operations, skills management, AI enrichment (OpenAI/Anthropic), bulk import, image upload.
- **AI Matchmaking**: OpenAI-powered role analysis, iterative refinement, confidence scoring, skills matching. Includes a Reinforcement Learning from Human Feedback (RLHF) system for continuous improvement.
- **Workspace System**: Multi-tenant architecture with isolation, comprehensive role-based permissions (Admin, Owner, Editor, Member), granular permissions (25+), server-side enforcement, audit logging, invitation system, slug-based routing. The system has robust workspace switching and management features.
- **List Management**: Curated designer lists, sharing capabilities (public/private), email sharing (SendGrid), collaborative building.
- **Hiring Feature**: Job posting, AI-powered designer matching, job management, status tracking.
- **Recruiting Board**: Visual kanban board for tracking designers through recruitment pipeline. Features drag-and-drop functionality, customizable columns (default: Backlog, Outreach, Interviewing, Offer, Hired), bulk designer import from lists or directory, notes tracking. Built with @dnd-kit for smooth drag-and-drop experience.
- **Inbox Feature**: AI-powered recommendation system for workspace maintenance. Provides intelligent suggestions for adding designers to lists based on skills/metadata, recommending new list creation, and identifying outdated designer profiles that need updating. Features quick approval workflows, filtering/sorting capabilities, and comprehensive audit trails. Built with modular generator architecture supporting three recommendation types (add_to_list, create_list, update_profile) with RLHF integration for continuous improvement.
- **Saved Searches**: Users can save search filters (skill, title, location) and quickly reuse them. Per-user isolation ensures privacy within workspaces. Integrated in DirectoryPage and SearchResultsPage.
- **Activity Feed**: Workspace activity tracking with cursor-based pagination. Logs designer CRUD, list management, member join/leave, saved search actions. Accessible via /:workspaceSlug/activity route. Includes actor metadata for auditing.
- **Command Palette**: Keyboard-accessible navigation (CMD+K / Ctrl+K) for quick access to pages and actions within the current workspace.
- **Bulk Actions**: Multi-select designers in DirectoryPage with floating action bar. Bulk add to lists functionality.
- **CSV Export**: Export designers from directory, lists, and search results to CSV format.
- **Modal System**: Uses Radix UI Dialog with comprehensive design system for consistent, reliable centering and optimal usability across devices. All modals follow standardized spacing patterns (h-11 inputs, space-y-6 forms, space-y-2 field wrappers, resize-none textareas) with responsive grid layouts. The system provides excellent keyboard ergonomics with Escape dismissal and smooth tab navigation. Updated October 2025 with improved form field padding, optimized vertical space usage, and responsive width handling.

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