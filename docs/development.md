# Development Guide

## Local Dev Server
Run `npm run dev`. This will launch:
1. The Express API server on port 3000.
2. Vite middleware injected into Express to serve React with HMR.

## Building for Production
Run `npm run build`. This runs:
- `vite build` (compiles React to `/dist`).
- `esbuild` (compiles `server.ts` to `/dist/server.cjs`).

## Adding Characters
Modify or add `.json` files in `data/characters/`.

## Theming
Tailwind CSS is used extensively. The primary theme leverages deep purples (`#1a0f2e`), warm ambers (`#f59e0b`), and dark backdrops to simulate a magical environment.
