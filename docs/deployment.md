# Deployment

WizTalk runs as one Express service. Development uses Vite middleware. Production serves the Vite output from `dist` and serves the API from the same process.

## Render

Current production configuration:

- Build: `npm install && npm run build`
- Start: `npm start`
- `NODE_ENV=production`
- `WIZTALK_DB_PATH=/data/wiztalk.sqlite`
- Persistent Render disk mounted at `/data`

The SQLite database is durable across application restarts because the database file lives on the persistent disk.

## Database startup

The application opens SQLite in WAL mode, enables foreign-key enforcement and a busy timeout, then runs all pending migrations before serving requests.

Do not treat the migration command as a replacement for startup migration safety. The application itself is responsible for bringing the schema to the current version.

## Data ownership

Built-in Character JSON remains repository data. User accounts, sessions, conversations, messages, profiles, preferences, custom Characters, Character settings and response logs are server-side SQLite data.

Browser localStorage is not used as the persistence source for account-owned application data.

For multi-instance/high-write deployments, the persistence layer should be moved to a network database such as PostgreSQL before horizontal scaling. The current Render deployment is intentionally a single service with a persistent SQLite disk.
