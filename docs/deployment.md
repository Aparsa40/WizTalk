# Deployment

WizTalk runs as one Express service. Development uses Vite middleware. Production serves the Vite output from dist and the API from the same process.

## Requirements

- Node.js 22.5+
- A writable database path for local development
- Persistent storage for production SQLite

## Current deployment status

The application is currently live at [https://wiztalk.onrender.com](https://wiztalk.onrender.com) from the **`deploy/render-free`** branch. This branch was introduced as a temporary deployment path because a payment method is not currently available for the Render account.

The free deployment intentionally does **not** attach a persistent disk. It is therefore suitable for live testing and access to the application, but it is **not a durable production deployment**: SQLite data stored on the service filesystem may be lost when the service is restarted or recreated.

The **`main`** branch remains the intended production configuration. Its Render Blueprint uses the paid **`0.5c-512mb`** plan and a 2 GB persistent disk mounted at `/data`. That production topology can be deployed once a valid payment method has been added to the Render account.

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
