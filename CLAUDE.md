# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Build production site to ./dist/
npm run preview  # Preview production build locally
```

## Architecture

This is an Astro static site deployed to Netlify.

- `src/pages/` - Page routes (file-based routing)
- `src/components/` - Astro components (Layout.astro, Background.astro)
- `src/style/` - Global CSS
- `public/` - Static assets
- `netlify.toml` - Netlify build configuration
