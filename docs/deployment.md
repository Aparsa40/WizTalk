# Deployment

WizTalk runs as one Express service. Development uses Vite middleware. Production serves the Vite output from dist and serves the API from the same process.

For Render:
- Build command: npm install && npm run build
- Start command: npm start
- Set NODE_ENV=production.
- Let Render provide PORT, or set it explicitly. The server reads process.env.PORT and binds to 0.0.0.0.
- Set GEMINI_API_KEY and/or OPENAI_API_KEY only when those providers are enabled.

The built-in JSON data is part of the repository. Browser memory uses localStorage and is therefore client-specific; it is not a replacement for durable server persistence.
