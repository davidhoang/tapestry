# Components Directory

This directory contains all reusable UI components for the Tapestry application.

## Organization

### Core Components
- **AdminRoute** - Protected route for admin users
- **DesignerCard** - Card component for displaying designer profiles
- **EnrichmentDialog** - Dialog for enriching designer profiles with AI
- **Navigation** - Main navigation component with authentication
- **SkillsInput** - Input component for managing designer skills
- **WorkspaceSwitcher** - Dropdown for switching between workspaces

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
import { DesignerCard, Navigation, WorkspaceSwitcher } from '@/components';
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

- ✅ Fixed nested anchor tag warnings in Navigation component
- ✅ Added proper dialog accessibility attributes (DialogTitle, DialogDescription)
- ✅ Improved Avatar component usage in DesignerCard
- ✅ Better async error handling in SkillsInput and other components
- ✅ Organized component structure with index files
- ✅ Enhanced MarkdownEditor and MarkdownPreview wrapper components
- ✅ Fixed CSS duration warnings and ambiguous class names
- ✅ Updated all index files to reflect actual available components
- ✅ Proper wouter Link usage (to prop instead of href)
- ✅ Removed console.error statements for better error handling