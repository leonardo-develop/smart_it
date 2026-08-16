# Deploying Smart IT Hub to Render

## Overview

The app runs on [Render](https://render.com) as a Node web service. Render does **not**
offer managed MySQL (PostgreSQL only), so the database is hosted separately and Render
connects to it over the network.

Live service: https://smart-it-14f8.onrender.com

## Environment variables

Set these in Render → your service → **Environment**. All of them fall back to local
development values when unset, so nothing is needed to run the app on your own machine.

| Variable | Required | Local default | Notes |
|---|---|---|---|
| `DB_HOST` | yes | `localhost` | Use the provider's *public* host, not an internal one |
| `DB_PORT` | yes | `3306` | Managed hosts rarely use 3306 |
| `DB_USER` | yes | `root` | |
| `DB_PASSWORD` | yes | `1234` | |
| `DB_NAME` | yes | `smart_it_hub` | Often `defaultdb` or `railway` on managed hosts |
| `DB_SSL` | depends | unset | Set to `true` for Aiven / TiDB |
| `DB_SSL_CA` | depends | unset | Full contents of the provider's `ca.pem` |
| `PORT` | no | `3000` | Render sets this automatically — do not override |

## Database hosting

Currently pointed at Railway, but **Railway's free trial is a one-time $5 credit that
expires after 30 days**. The recommended permanent free option is
[Aiven for MySQL](https://aiven.io/free-mysql-database): real MySQL 8, 1 GB storage,
no credit card, free indefinitely.

Other options: AlwaysData (1 GB shared across the whole account), TiDB Cloud Serverless
(MySQL-compatible, larger free tier). Avoid db4free.net for anything but throwaway
testing, and avoid hosts like InfinityFree that block remote MySQL connections entirely.

### Loading the schema into a fresh database

There is no schema dump committed to this repo (`dpproject.sql` is just a `SELECT`).
Export from a working local database:

```bash
mysqldump -u root -p1234 --no-tablespaces smart_it_hub > smart_it_dump.sql
```

Then import:

```bash
mysql -h <HOST> -P <PORT> -u <USER> -p<PASS> --ssl-mode=REQUIRED <DB_NAME> < smart_it_dump.sql
```

Drop `--ssl-mode=REQUIRED` for hosts that don't use TLS.

### TLS note

Aiven signs certificates with its own project CA rather than a publicly-trusted one.
Setting `DB_SSL=true` alone will fail with `SELF_SIGNED_CERT_IN_CHAIN` — you must also
paste the downloaded `ca.pem` into `DB_SSL_CA`. Render's environment editor accepts
multi-line values. TiDB uses a public CA, so `DB_SSL=true` is sufficient there.

## Free tier caveats

- **The service sleeps after 15 minutes of inactivity.** The first request after that
  takes roughly 50 seconds to respond. This is expected on Render's free plan.
- **`uploads/` is wiped on every deploy.** Render's free disk is ephemeral, so files
  uploaded via `/api/upload-course-files` disappear on restart while the database rows
  referencing them survive. Moving uploads to object storage (Cloudinary, S3) is the
  fix if this matters.
- Aiven powers off free services after an extended idle period, with email warning first.

## Local development

```bash
npm install
npm start
```

Requires a local MySQL with a `smart_it_hub` database, user `root`, password `1234`.
