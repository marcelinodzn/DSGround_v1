# DSGround

A design system management platform.

## Project Structure

```
📁 DSGround/
├── 📁 src/                      # Source code
│   ├── 📁 app/                  # Next.js app directory
│   │   ├── 📁 auth/             # Authentication routes
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── 📁 brands/          # Brand management routes
│   │   │   ├── [brandId]/      # Individual brand view
│   │   │   │   ├── foundations/  # Brand foundations
│   │   │   │   │   └── typography/  # Brand typography settings
│   │   │   │   └── page.tsx    # Brand overview
│   │   │   ├── typography/     # Brand typography management
│   │   │   ├── new/            # New brand creation
│   │   │   └── page.tsx        # Brands listing
│   │   ├── 📁 foundations/     # Global foundations
│   │   │   └── typography/     # Global typography settings
│   │   ├── 📁 settings/        # Settings routes
│   │   │   ├── typography/     # Typography settings
│   │   │   └── page.tsx        # Main settings
│   │   ├── 📁 api/             # API routes
│   │   │   ├── webhooks/
│   │   │   └── trpc/
│   │   └── layout.tsx          # Root layout
│   ├── 📁 components/          # Shared UI components
│   │   ├── 📁 ui/              # Base UI components
│   │   │   ├── button.tsx
│   │   │   └── input.tsx
│   │   ├── 📁 forms/           # Form components
│   │   └── 📁 layout/          # Layout components
│   ├── 📁 modules/             # Feature-specific modules
│   │   ├── 📁 brands/          # Brand-related components
│   │   │   ├── brand-selector.tsx
│   │   │   └── typography/
│   │   └── 📁 settings/        # Settings-related components
│   ├── 📁 lib/                 # Libraries and utilities
│   │   ├── 📁 db/              # Database utilities
│   │   ├── 📁 auth/            # Auth utilities
│   │   └── 📁 utils/           # Helper functions
│   ├── 📁 hooks/               # Custom React hooks
│   ├── 📁 config/              # Configuration files
│   ├── 📁 types/               # TypeScript types
│   ├── 📁 styles/              # Global styles
│   └── 📁 store/               # State management
├── 📁 public/                  # Static assets
├── README.md                   # Project documentation
├── package.json               # Project dependencies
├── tsconfig.json             # TypeScript configuration
└── .eslintrc.js              # ESLint configuration
```

### Directory Structure Guidelines

1. **app/**: Contains all Next.js pages and routes
   - Use plural form for resource names (e.g., `brands`, `settings`)
   - Keep page components minimal, delegate logic to modules

2. **modules/**: Contains feature-specific logic and components
   - Each module should be self-contained
   - Include related components, hooks, and utilities
   - Use plural form for module names

3. **components/**: Contains shared UI components
   - `ui/`: Base components like buttons, inputs
   - `layout/`: Layout-related components
   - `forms/`: Form-related components

4. **lib/**: Contains shared utilities and services
   - Keep utilities small and focused
   - Group related utilities in subdirectories

### Best Practices

1. Keep routes in `app/` minimal and focused on page structure
2. Put business logic and complex components in `modules/`
3. Share common UI components through `components/`
4. Use consistent naming (plural for resources)
5. Keep related code close together in modules

## Key Features

- Brand Management
- Typography System
- Font Management
- Settings Configuration

## Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

## Project Organization

- **App Router**: Using Next.js 13+ App Router with clean route organization
- **Modular Architecture**: Feature-specific code is organized in the `modules` directory
- **Component Structure**: 
  - `ui/`: Reusable UI components
  - `layout/`: Layout components
  - `shared/`: Shared components
- **State Management**: Using custom stores in the `store` directory
- **Authentication**: Route protection is handled through middleware
