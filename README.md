# WizTalk V1.0.0

WizTalk is a local-first, character-based conversational AI web application. Designed initially as a magical, Harry Potter-themed experience, it is built with an extensible architecture capable of scaling into a general-purpose AI platform.

## Features
- 🪄 **Magical Experience**: Immersive, warm, character-centric UI.
- 🇮🇷 **Persian-First**: Full RTL layout and Persian language support out of the box.
- 🗣️ **Voice Integration**: Native Speech-to-Text and Text-to-Speech capabilities.
- 🧠 **AI Flexibility**: Connects to OpenAI, Google Gemini, or works entirely offline using a local FAQ fallback.
- 💾 **Local Memory**: Preserves chat history safely in your browser.
- 📱 **Responsive**: Works beautifully on Desktop, Tablet, and Mobile.

## Project Structure
- `frontend/`: React + Vite + Tailwind CSS UI.
- `backend/`: Express server proxying AI API calls.
- `data/`: Local character configurations and FAQ knowledge base.
- `docs/`: Comprehensive architecture and deployment guides.

## Local Installation (Windows/Mac/Linux)
1. Ensure Node.js (v20+) is installed.
2. Clone this repository.
3. Run `npm install` to install dependencies.
4. Copy `.env.example` to `.env` and configure your API keys (e.g., `GEMINI_API_KEY`).
5. Run `npm run dev` to start the application.
6. Open your browser to `http://localhost:3000`.

## Render Deployment
1. Connect this GitHub repo to Render.
2. Build Command: `npm install && npm run build`
3. Start Command: `npm start`
4. Set required Environment Variables.

## Documentation
Please check the `docs/` folder for detailed guides on Architecture, Memory Systems, Voice configuration, and Future Agent implementations.

## Limitations
- V1 utilizes `localStorage` for memory (no cross-device sync).
- Voice features depend on native browser support.
- Does not currently support complex multi-agent reasoning (planned for future).

## License
Private / Personal Use
