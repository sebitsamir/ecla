# Production runbook

## Release path

Pull requests and pushes to `main` run `.github/workflows/quality.yml`. API gates compile the production server, validate all content, apply migrations to an isolated PostgreSQL service, and run unit and integration tests. Web gates run lint with zero warnings, typecheck, tests, and the production build. Both jobs reject high-severity production dependency advisories.

Staging uses `docker-compose.staging.yml` and `deploy/staging.env.example`. Copy the example to the ignored `deploy/staging.env`, provide secrets through the host secret store, and set `POSTGRES_PASSWORD` and `STAGING_API_URL` outside the file. A short-lived build-stage container applies migrations; the API runtime excludes the Prisma CLI and its toolchain. Before promoting an image, verify `/api/v1/health/live`, `/api/v1/health/ready`, the first canonical scene, one resumable attempt, privacy export, and a non-graduating failed Gateway.

No production destination or credentials are stored in this repository. The pipeline builds and verifies deployable artifacts; connecting it to a hosting account remains an explicit operator action.

## Deploy and rollback

1. Back up the database and record the image and Git revision.
2. Apply `prisma migrate deploy` before starting the new API.
3. Start the API and wait for readiness before routing traffic.
4. Start the web image built with the correct immutable `NEXT_PUBLIC_API_URL`.
5. Run `TARGET_ORIGIN=https://api.staging.example node ops/load-smoke.mjs`.
6. Promote only after the smoke journey succeeds.

For an application rollback, route traffic to the previous image. Database migrations in this repository are additive; do not run ad-hoc down migrations. If a migration causes data corruption, stop writes and perform the documented restore into a new database, verify it, then switch `DATABASE_URL`.

## Backup and restore drill

Create encrypted provider-managed daily backups with point-in-time recovery. Before a release, also create a logical custom-format backup:

```sh
pg_dump --format=custom --no-owner --file=ecla-$(date +%Y%m%d-%H%M).dump "$DATABASE_URL"
```

Quarterly, restore into a new non-production database whose name contains `restore_drill`:

```sh
createdb "$RESTORE_DRILL_DATABASE"
pg_restore --no-owner --exit-on-error --dbname="$RESTORE_DRILL_DATABASE_URL" ecla-YYYYMMDD-HHMM.dump
psql "$RESTORE_DRILL_DATABASE_URL" -c 'select count(*) from "User";'
```

Record backup timestamp, restore duration, migration status, row-count checks, and the operator. Never test restoration over the source database. A backup is not considered valid until this drill succeeds.

## Operations

Logs are one JSON object per line with request ID, method, path, status, and duration. Bodies, authorization headers, transcripts, and email addresses are excluded. Forward stdout/stderr to the platform log system and alert on readiness failures, HTTP 5xx rate, provider timeout rate, and sustained 429s.

Run `npm run retention` from the compiled API image daily. Use provider-side hard spending limits in addition to the per-user PostgreSQL budgets. Graceful shutdown changes readiness to 503 before closing the listener.
