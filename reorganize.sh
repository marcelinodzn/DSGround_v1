#!/bin/bash

# Create necessary directories
mkdir -p src/app/auth/{login,register,"forgot-password"}
mkdir -p src/app/dashboard/settings
mkdir -p src/app/api/{webhooks,trpc}
mkdir -p src/components/{ui,forms,layout}
mkdir -p src/lib/{db,auth,utils}
mkdir -p src/hooks src/config src/types src/styles src/public
mkdir -p src/modules/brands
mkdir -p prisma

# Move auth-related files
mv src/app/auth/login/signin/* src/app/auth/login/
rmdir src/app/auth/login/signin

# Move UI components
mv src/components/ui/* src/components/ui/
mv src/components/layout/* src/components/layout/

# Move styles
mv src/app/globals.css src/styles/

# Move settings
mv src/app/settings/* src/app/dashboard/settings/

# Clean up empty directories and parentheses directories
rm -rf src/app/\(app\)
find . -type d -empty -delete

# Move brand-related files to modules
mv src/app/brands/* src/modules/brands/
mv src/components/brand/* src/modules/brands/
mv src/components/brands/* src/modules/brands/

# Move hooks
mv src/components/hooks/* src/hooks/

# Clean up duplicate directories
rm -rf src/app/brands src/components/brand src/components/brands src/components/hooks

# Create necessary Next.js files
touch src/app/layout.tsx
touch src/app/page.tsx
