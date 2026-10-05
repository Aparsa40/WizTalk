# Deployment

WizTalk runs as one Express service. Development uses Vite middleware. Production serves the Vite output from dist and the API from the same process.

## Requirements

- Node.js 22.5+
- A writable database path for local development
- Persistent storage for production SQLite

## Render

The repository contains render.yaml for the supported first production topology:

- service: Node web service
- build: npm ci && npm run build
- start: npm start
- health check: /api/health
- NODE_ENV=production
- WIZTALK_DB_PATH=/data/wiztalk.sqlite
- persistent /data disk (2 GB in the current Blueprint)
- single application instance while SQLite remains the datastore

The database is initialized on server startup and pending SQL migrations are applied transactionally before the application uses the database. Migration history is recorded in schema_migrations.

## Persistence

Server-side durable data includes authentication, chat sessions, messages, Character/user-scoped knowledge documents, custom Characters, user preferences, Character settings, and response telemetry.

The database file must live on persistent storage in production. Do not place the production database inside the disposable application filesystem.

Built-in Character JSON remains part of the repository. Custom Characters and user-facing settings are authenticated server-side and owned by the current user.

## CI and release gate

Before merging or deploying, verify:

    npm ci
    npm run lint
    npm test
    npm run build

The CI workflow also performs a production startup smoke test, including health checks and an authenticated registration/session flow against a temporary SQLite database.

## Scaling limitation

A persistent SQLite disk is appropriate for the current single-instance deployment. It is not a shared database and must not be used with horizontally scaled application instances. If WizTalk needs multiple web instances, migrate the durable application state to a shared database such as PostgreSQL first.

## Operations

- Keep WIZTALK_DB_PATH under the persistent mount in production.
- Back up the persistent disk before schema-changing releases when an operational backup policy is required.
- Treat migration failures as deployment blockers; do not start serving traffic against a partially migrated schema.
