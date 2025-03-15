# DSGround Project Structure Documentation

## Overview

DSGround is a design system management platform that helps teams create, manage, and maintain consistent design systems. The application provides tools for brand management, typography settings, color palettes, and design token exports.

## Tech Stack

- **Frontend**: Next.js (App Router), React
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI with shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployments**: Vercel

## Project Structure

```
📁 DSGround/
├── 📁 src/                      # Source code
│   ├── 📁 app/                  # Next.js app directory (App Router)
│   │   ├── 📁 ai-analysis/      # AI analysis features
│   │   ├── 📁 api/              # API routes
│   │   ├── 📁 brands/           # Brand management routes
│   │   │   ├── [brandId]/       # Individual brand view
│   │   │   ├── foundations/     # Brand foundations
│   │   │   └── page.tsx         # Brands listing
│   │   ├── 📁 foundations/      # Global foundations
│   │   ├── 📁 overview/         # Overview/dashboard
│   │   ├── 📁 platforms/        # Platform management
│   │   ├── 📁 settings/         # Settings
│   │   ├── 📁 sign-in/          # Authentication
│   │   ├── 📁 sync/             # Synchronization features
│   │   ├── 📁 tokens/           # Design tokens management
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Home page
│   ├── 📁 components/           # Shared UI components
│   │   ├── 📁 ui/               # Base UI components (shadcn/ui)
│   │   ├── 📁 forms/            # Form components
│   │   └── 📁 layout/           # Layout components
│   ├── 📁 config/               # Configuration files
│   ├── 📁 contexts/             # React context providers
│   ├── 📁 hooks/                # Custom React hooks
│   ├── 📁 lib/                  # Utility libraries
│   │   ├── color-utils.ts       # Color utilities
│   │   ├── font-utils.ts        # Font utilities
│   │   ├── generate-pdf.ts      # PDF generation
│   │   ├── scale-calculations.ts # Typography scale calculations
│   │   ├── style-dictionary.ts  # Style Dictionary integration
│   │   ├── supabase.ts          # Supabase client configuration
│   │   └── utils.ts             # General utilities
│   ├── 📁 modules/              # Feature modules
│   ├── 📁 providers/            # Provider components
│   ├── 📁 store/                # Zustand state stores
│   │   ├── brand-store.ts       # Brand management state
│   │   ├── platform-store.ts    # Platform management state
│   │   ├── typography.ts        # Typography state
│   │   └── ...                  # Other state stores
│   ├── 📁 styles/               # Global styles
│   ├── 📁 types/                # TypeScript type definitions
│   └── middleware.ts            # Next.js middleware
├── 📁 migrations/               # Database migrations
│   ├── 20240209003500_create_typography_tables.sql
│   ├── 20240209224900_create_fonts_tables.sql
│   ├── 20240303000000_create_design_element_tables.sql
│   ├── 20240305000000_add_tab_columns_to_typography_settings.sql
│   └── 20240306000000_create_color_palettes_table.sql
├── 📁 figma-plugin/             # Figma plugin integration
├── 📁 public/                   # Static assets
├── 📁 supabase/                 # Supabase configuration
├── .env.local                   # Environment variables (local)
├── next.config.js               # Next.js configuration
├── package.json                 # Dependencies and scripts
├── tailwind.config.js           # Tailwind CSS configuration
└── tsconfig.json                # TypeScript configuration
```

## Key Features and Components

### 1. Brand Management

The application allows users to create and manage brands with the following capabilities:
- Create master and sub-brands
- Configure brand-specific design tokens
- Manage brand assets and resources

**Key Files:**
- `src/store/brand-store.ts` - State management for brands
- `src/app/brands/` - Brand-related pages and routes

### 2. Typography System

A comprehensive typography system that enables:
- Font management and uploads
- Typography scale configuration
- Text style presets

**Key Files:**
- `src/store/typography.ts` - Typography state management
- `src/lib/scale-calculations.ts` - Typography scale calculations
- `src/app/foundations/typography/` - Typography management UI

### 3. Color System

Manage color palettes and tokens with:
- Color creation and organization
- Palette generation
- Color contrast checking

**Key Files:**
- `src/lib/color-utils.ts` - Color utility functions
- `migrations/20240306000000_create_color_palettes_table.sql` - Color palettes database schema

### 4. Design Token Export

Export design tokens in various formats:
- Style Dictionary
- CSS variables
- JSON

**Key Files:**
- `src/lib/style-dictionary.ts` - Style Dictionary integration
- `src/lib/style-dictionary-sync.ts` - Synchronization utility

## Database Schema

The application uses Supabase (PostgreSQL) with the following primary tables:

### Brands
```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'master',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Typography Settings
```sql
CREATE TABLE typography_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  font_id UUID REFERENCES fonts(id),
  scale_ratio FLOAT,
  base_size FLOAT,
  line_height FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Color Palettes
```sql
CREATE TABLE color_palettes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Supabase Integration

The application uses Supabase for database and authentication:

**Configuration:**
- `src/lib/supabase.ts` - Main Supabase client configuration
- `.env.local` - Environment variables for Supabase connection

**Key Features:**
- Authentication
- Database operations
- Real-time subscriptions
- Storage for assets

**Connection Setup:**
1. Supabase client is initialized in `src/lib/supabase.ts`
2. Environment variables are used for connection URL and API key
3. The client is exported and used throughout the application
4. A mock client is provided for static generation during build time

## Development Workflow

1. Run the development server:
```bash
npm run dev
```

2. Access the application at http://localhost:3000

3. Create and manage brands, typography, and design tokens

4. Use the Figma plugin integration for design synchronization

## Deployment

The application is configured for deployment on Vercel:

1. Environment variables are set in the Vercel dashboard
2. Database migrations are applied during deployment
3. Automatic preview deployments are generated for pull requests

## Project Maintenance

Regular maintenance tasks include:
- Database migrations for schema updates
- Dependency updates
- Performance optimization
- Code refactoring and cleanup
