# Components Directory

This directory contains all reusable UI components for the Tapestry application.

## Organization

### Core Components
- **ChatInterface** - Main chat interface for AI matchmaking conversations
- **DesignerCard** - Card component for displaying designer profiles
- **EnrichmentDialog** - Dialog for enriching designer profiles with AI
- **Navigation** - Main navigation component with authentication
- **SkillsInput** - Input component for managing designer skills

### Organized by Category

#### `/common`
Common components used throughout the application

#### `/dialogs`
Dialog and modal components

#### `/forms`
Form-related components and inputs

#### `/layouts`
Layout and navigation components

#### `/ui`
Shadcn/ui components - low-level UI primitives

## Usage

Import components from the main index file:

```tsx
import { DesignerCard, ChatInterface, Navigation } from '@/components';
```

Or import from specific categories:

```tsx
import { SkillsInput } from '@/components/forms';
import { EnrichmentDialog } from '@/components/dialogs';
```

## Accessibility

All components follow accessibility best practices:
- Proper ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- Focus management

## Recent Improvements

- Fixed nested anchor tag warnings
- Added proper dialog accessibility attributes
- Improved Avatar component usage
- Better error handling in async operations
- Organized component structure with index files