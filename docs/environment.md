# Environment Configuration

Create a `.env` file in the root directory based on `.env.example`.

## Variables

- `GEMINI_API_KEY`: Your Google Gemini API Key. Used in `server.ts` to connect to the Gemini model.
- `APP_URL`: The URL where the app is hosted (optional for V1).

## Notes
- `OPENAI_API_KEY` is not required globally in V1, as it is supplied by the user inside the application's "Settings" UI and sent via the request body to the backend proxy. In a larger production app, this would also sit in `.env`.
