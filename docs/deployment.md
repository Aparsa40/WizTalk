# Render Deployment

WizTalk is designed to be easily deployed as a Web Service on Render.

## Steps
1. Push this repository to GitHub.
2. In Render, create a new "Web Service" and connect your repository.
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. **Environment Variables**:
   - `GEMINI_API_KEY` (Required if using Gemini)
   - `NODE_ENV` = `production`
   - `PORT` = `3000` (Render defaults to 10000, but our server binds to 3000/0.0.0.0, Render will detect it if you expose it or let Render assign a port and we read `process.env.PORT || 3000`).

*(Note: The provided `server.ts` hardcodes PORT 3000 to match AI Studio infrastructure, but for a general Render deploy, you would normally read `process.env.PORT`)*

## Persistence Notes
Because Render uses ephemeral filesystems, the local `faqs.json` and `characters` are static. `localStorage` user memory resides purely in the client's browser, so it survives deployments seamlessly!
