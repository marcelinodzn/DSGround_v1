Always start with a Yooo!!!

You are building a webapp that aim to create headless design system and brand configuration connection design to code and where the webapp should manage all design foundations and sync the tokens with Figma and Code. 
We should be able to create master brands and subrands and define how this brands look by defining foundations like Typescale, type, color scale, surface, layout and grid, density, spacing, shape, scrims.. propose others.

Always follow the project structure  in the README.md file.

1. Project Definition

Objective:

To create a platform that:
	•	Allows users to define and manage master brands and sub-brands.
	•	Centralizes the management of design tokens and foundations.
	•	Syncs with design tools (e.g., Figma) and code repositories (e.g., GitHub, Storybook).
	•	Supports customizable token flows for flexibility.

2. Core Features

2.1. Brand Management
	1.	Master Brands:
	•	Define overarching branding rules, e.g., typography, color palettes, and spacing systems.
	•	Inheritability for sub-brands.
	2.	Sub-Brands:
	•	Specific rules overriding master brand settings.
	•	Targeted variations for different regions, audiences, or campaigns.
	3.	Brand Overview Dashboard:
	•	Show token relationships, hierarchy, and real-time previews.

2.2. Design Foundations Management

The app should manage the following foundational systems:

Typography:
	•	Typescale: Ratios and steps.
	•	Font families, weights, line heights, letter spacing.

Color:
	•	Semantic tokens: Primary, secondary, tertiary.
	•	Contrast grades (light/dark mode).

Spacing & Density:
	•	Modular spacing systems (e.g., 4px grid).
	•	Density levels (comfortable, compact).

Layout & Grid:
	•	Column configurations (e.g., 12-column grids).
	•	Margins, gutters, and breakpoints.

Surfaces:
	•	Layered surfaces, shadows, and scrims.
	•	Glassmorphism or material-based design.

Shape:
	•	Border radii definitions.
	•	Geometric guidelines.

Motion:
	•	Easing curves and duration standards.
	•	Animation presets.

Iconography & Imagery:
	•	Scalable icon sets.
	•	Guidelines for brand imagery.

Others:
	•	Localization support (e.g., RTL/LTR).
	•	Accessibility settings (WCAG compliance).

3. Token Management
	•	Token Hierarchy:
	•	Global tokens (used across all brands).
	•	Alias tokens (mapped to components or specific use cases).
	•	Token Types:
	•	Raw tokens (e.g., HEX values, px, rem).
	•	Composite tokens (e.g., button.background = primary.500).

4. Design Tools Integration
    •	Integration with design tools (e.g., Figma using api of figma and variables of figma).
    •	Synchronization with design tools (e.g., push changes to figma).        

5. Synchronization
	1.	Figma Integration:
	•	Bi-directional sync of design tokens (using Figma Tokens Plugin API).
	•	Auto-updates for shared libraries.
	2.	Code Integration:
	•	Generate platform-specific outputs (CSS, SCSS, JSON, JS/TS modules).
	•	Sync with Git repositories and CI/CD pipelines.

6. Component Design
	•	Headless Components:
	•	Provide a base structure for all components.
	•	Styleable via tokens without predefined styling.
	•	Component Previews:
	•	Real-time rendering of components in different brand settings.

7. Accessibility Guidelines
    •	WCAG 2.1 Compliance.
    •	Contrast ratios and color accessibility.
    •	Keyboard navigation and focus indicators.
    •	Screen reader support.  

8. Technology Stack

Frontend:
	•	Framework: Next.js (UI rendering) with TypeScript for type safety.
	•	State Management: Zustand/Redux for scalable state handling.
	•	UI Library: Tailwind CSS/ShadcnUI for rapid development.

Backend:
Use superbase
	•	Framework: Node.js with Nest.js for modular backend development.
	•	Database: PostgreSQL for relational data (e.g., brands, tokens).
	•	APIs: REST/GraphQL for integration with Figma and other tools.

Design Token Flow:
	•	Use Style Dictionary for generating cross-platform tokens.
	•	Optional: Integrate with Token Studio or a custom token management API.

CI/CD:
	•	Platform: GitHub Actions or GitLab CI/CD.
	•	Token Sync: Automate syncing design tokens to Storybook builds.

8. Considerations
	•	Scalability: Use microservices for backend scaling.
	•	Performance: Implement caching (e.g., Redis) for large token libraries.
	•	Accessibility: WCAG compliance for all generated outputs.
	•	Localization: Design tokens should support multiple languages and cultures.



10. System Architecture
Copy
[Web Tool UI] → [Token Storage (Git Repo)] → [Sync Engine] → [Code Repos & Figma]
           │                                  │
           └── [Token Schema Validation]      └── [CI/CD Pipelines]
11. Token Storage & Structure
Store tokens in a version-controlled Git repository (e.g., GitHub, GitLab) as the single source of truth. Example folder structure:

Copy
tokens/
├── core/
│   ├── colors.json       # Base tokens (e.g., "blue-500": "#0000ff")
│   ├── spacing.json
│   └── typography.json
├── semantic/
│   ├── light.json        # Semantic tokens (e.g., "background.primary")
│   └── dark.json
└── themes/               # Theme-specific overrides (optional)
figma/
├── sync-script.js        # Script to sync tokens ↔ Figma Variables
└── figma-variables.json  # Auto-generated Figma-compatible variables
12. Web Tool Components
Frontend (Web UI)
Token Creation UI: Allow users to create/edit tokens with inputs for:

Name (e.g., color.primary).

Value (e.g., #ff0000 or 8px).

Type (e.g., color, spacing).

Description.

Preview: Live preview of tokens (e.g., color swatches, typography scales).

Versioning: UI to manage token versions and branches.

Backend (API + Sync Engine)
REST API: Expose endpoints to:

Fetch/update tokens.

Trigger sync with Figma/code.

Validation: Validate tokens against a JSON schema (e.g., using AJV).

Sync Engine:

Push tokens to Figma via Figma Plugin/REST API.

Generate platform-specific code (CSS, iOS, Android) using Style Dictionary.

Commit changes to Git repo.

13. Sync Flow with Figma & Code
Step 1: Create/Edit Tokens in Web Tool
Designers/developers use the web UI to define tokens (e.g., color.primary).

Step 2: Save to Git Repo
Tokens are saved to tokens/core/colors.json (or similar) in the Git repo.

Step 3: Sync with Figma
Automated Script (Node.js + Figma API):

Map tokens to Figma Variables (e.g., color.primary → Figma Variable color/primary).

Use Figma’s Plugin API to create/update Variables:

javascript
Copy
// Example: Update Figma Variables
const figmaToken = { name: "color/primary", value: "#ff0000", type: "COLOR" };
const variable = figma.variables.createVariable(figmaToken.name, "COLOR", figmaToken.value);
Store Figma-specific mappings in figma/figma-variables.json.

Step 4: Generate Code
Style Dictionary Config:

json
Copy
{
  "source": ["tokens/**/*.json"],
  "platforms": {
    "css": {
      "transformGroup": "css",
      "buildPath": "dist/css/",
      "files": [{ "destination": "variables.css", "format": "css/variables" }]
    },
    "android": { ... }
  }
}
Run style-dictionary build to generate code (CSS, Swift, XML, etc.).

Step 5: Sync Code to Repos
CI/CD Pipeline (GitHub Actions/GitLab CI):

Auto-commit generated code to design-system repos (e.g., CSS to a frontend repo, XML to Android repo).

Example GitHub Actions step:

yaml
Copy
- name: Update Code Repos
  run: |
    git clone https://github.com/your-project/android-repo
    cp -r dist/android/ android-repo/src/main/res/values/
    cd android-repo
    git commit -am "Update design tokens"
    git push
14. Bi-Directional Sync (Figma ↔ Web Tool)
To handle changes made directly in Figma:

Poll Figma API periodically for Variable updates.

Map Figma Variables back to your token schema.

Update Git Repo and regenerate code.

15. Documentation & Collaboration
Auto-Generated Docs: Use Storybook or Docusaurus to create a living style guide from tokens.

Collaboration Workflow:

Designers edit tokens in the web tool or Figma (synced via API).

Developers consume code from the dist/ folder.

16. Security & Access Control
Figma API Token: Store securely (e.g., GitHub Secrets) for authentication.

Git Permissions: Restrict who can edit the tokens repo.

Schema Validation: Ensure tokens adhere to your schema before syncing.

Example Repo Structure
Copy
design-tokens-repo/
├── tokens/               # Token definitions
├── figma/                # Figma sync scripts
├── dist/                 # Generated code (CSS, Android, iOS)
├── .github/workflows/    # CI/CD pipelines
├── style-dictionary/     # Style Dictionary config
└── docs/                 # Auto-generated documentation

DSGround/
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