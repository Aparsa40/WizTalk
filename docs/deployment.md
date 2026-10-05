# Deployment

WizTalk runs as one Express service. Development uses Vite middleware. Production serves the Vite output from `dist` and the API from the same process.

## Render

The repository contains `render.yaml` with:

- build: `npm install && npm run build`
- start: `npm start`
- `NODE_ENV=production`
- `WIZTALK_DB_PATH=/data/wiztalk.sqlite`
- a persistent `/data` disk

The database is initialized on server startup and pending SQL migrations are applied before the application uses the database.

## Persistence

Server-side durable data includes authentication, chat sessions, messages, Character-scoped knowledge documents, and response telemetry.

The database file must live on persistent storage in production. Do not place the production database inside the disposable application filesystem.

Built-in Character JSON remains part of the repository.

Custom Characters and some user-facing settings remain browser-local until their authenticated server persistence phase is implemented.

## Operations

Before production releases, verify:

```bash
npm run lint
npm test
npm run build
```

and verify that the configured database path is writable and backed by persistent storage.
