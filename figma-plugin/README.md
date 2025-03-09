# DSGround Typography Plugin for Figma

This Figma plugin allows you to import typography styles from your DSGround application directly into Figma. It creates text styles for each platform and type style in your design system.

## Features

- Import typography styles from JSON files
- Create text styles with proper font family, size, weight, line height, and letter spacing
- Organize styles by platform
- Support for text transformations (uppercase, lowercase, capitalize)
- Preview JSON data before importing

## Installation

1. Download the latest release from the [releases page](https://github.com/your-username/dsground-typography-plugin/releases)
2. In Figma, go to **Plugins > Development > Import plugin from manifest...**
3. Select the `manifest.json` file from the downloaded release

## Usage

1. Export your typography styles from DSGround as JSON
   - In DSGround, go to the Typography page
   - Click on the "Documentation" button
   - In the Documentation modal, click "Export as JSON"
   - Save the JSON file to your computer

2. Open the plugin in Figma
   - Go to **Plugins > DSGround Typography > Import Typography Styles**

3. Import your typography styles
   - Click "Choose JSON File" and select the JSON file you exported from DSGround
   - Review the preview to ensure the data looks correct
   - Click "Import Styles" to create the text styles in Figma

## Development

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

3. Build the plugin:
   ```
   npm run build
   ```
   or
   ```
   yarn build
   ```

4. Import the plugin into Figma:
   - Go to **Plugins > Development > Import plugin from manifest...**
   - Select the `manifest.json` file from the `dist` directory

### Development Workflow

- Run the development build with watch mode:
  ```
  npm run dev
  ```
  or
  ```
  yarn dev
  ```

## License

MIT 