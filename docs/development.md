# Development

Run npm run dev for the Express server with Vite middleware and HMR. Run npm run lint for TypeScript checking. Run npm run build for the client and bundled production server. Run npm start after a production build.

Keep provider-specific code in server/services/ai.ts and browser capabilities in src/services. Add character behavior through data and configuration rather than conditionals in ChatUI. Keep .env.example synchronized with server-owned environment variables.
