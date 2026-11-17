# Vercel deployment (test environment)

The root `vercel.json` defines Vercel Services: a static Vite frontend and the
existing FastAPI Docker image. The backend container retains PyTorch, MediaPipe,
OpenCV, the trained model files and FFmpeg. It listens on the `PORT` environment
variable, falling back to 8000 for local Docker. Vercel Services
and Container Runtime are beta features; verify availability and build/runtime
limits on the target account before treating this as a production deployment.

References:
- https://vercel.com/docs/services
- https://vercel.com/docs/services/config-reference
- https://vercel.com/docs/services/routing
- https://vercel.com/docs/functions/runtimes/container

## 1. Publish the configuration to the personal fork

Commit `vercel.json`, `.vercelignore`, and this guide on `qnhu`.
The local `origin` may still point to the team's repository. Add a separate remote
for the fork rather than replacing the team remote:

```powershell
git remote add personal https://github.com/quynhnhu12092005-gif/vsl-connect.git
git push personal qnhu
```

If `personal` already exists, check its address locally before using it. Do not
force-push. Pushing to the team repo does not update the fork automatically.

## 2. Choose the branch before deploying

The Vercel import screen can select `main` before a project exists. Do not deploy
that screen while it is showing old code without `vercel.json`.

For the dashboard-only workflow, publish a release to `main` **in the personal
fork** using a GitHub pull request with both base and head repositories set to
`quynhnhu12092005-gif/vsl-connect`, base `main`, compare `qnhu`. Review and merge
the pull request, then import that fork in Vercel again. Confirm the new commit
and Services configuration are visible. This does not merge into the team's repo.

To keep production on `qnhu` instead, create/link a project without deploying using
the Vercel CLI (`vercel link`), connect it to the personal fork, and set Project
Settings > Environments > Production > Branch Tracking to `qnhu` before deployment.
Do not confuse Team Settings with Project Settings. A default-branch change on
GitHub alone is not a reliable replacement for Vercel's production-branch setting.

## 3. Import settings and environment variables

- Repository: the personal fork.
- Root Directory: `./` (repository root).
- Application Preset: Services.
- Services: backend from `backend/Dockerfile`; frontend from `frontend` with Vite.
- Do not use either "Import single project" button for the combined deployment.

Enter the following in Vercel's environment variable settings. Copy secret values
directly from local `.env`, without posting them in chat or committing them.
Use the test database initially and keep preview/production databases separate
before processing real users' data.

| Variable | Value |
| --- | --- |
| `PORT` | `8000` explicitly, or the port assigned by Vercel; the container reads this value at startup |
| `TIDB_HOST`, `TIDB_PORT`, `TIDB_USER`, `TIDB_PASSWORD`, `TIDB_DB_NAME` | Test TiDB connection; port from TiDB, usually 4000 |
| `AUTH_TOKEN_SECRET` | Random secret of at least 32 characters; use a separate deployment secret |
| `AUTH_COOKIE_SECURE` | `true` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Verified Cloudinary credentials |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURITY`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM` | Brevo settings and verified sender |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth application credentials |
| `GOOGLE_REDIRECT_URI`, `GOOGLE_ADMIN_REDIRECT_URI` | Both `https://<stable-project-domain>/api/v1/auth/google/callback` |

Leave `TIDB_CA_PATH` unset to use the image's CA trust store. A Windows certificate
path cannot be used inside the cloud container. Local MySQL credentials are not
needed for this TiDB-backed deployment. Do not set `DATABASE_URL` as well unless
you deliberately want to override the split TiDB settings and configure its TLS.
Never use `VITE_*` variables for secrets. The browser calls `/api/v1/...` on the
same domain; it does not need a database URL or a private backend URL.

Once the stable Vercel domain is known, register the HTTPS callback above in
Google Cloud's authorized redirect URIs, update both environment variables and
redeploy. Admin is at `/admin` on the public domain. Use the stable domain for
OAuth, rather than each changing preview URL.

For `vsl-connect.vercel.app`, both callback variables are
`https://vsl-connect.vercel.app/api/v1/auth/google/callback`. With a shared host,
the signed OAuth flow purpose selects `/dang-nhap` or `/admin` after returning
from Google; a separate local admin host still returns to `/`. Account roles
are checked independently of this navigation, and email OTP remains required.

## 4. Migrations and verification

Migrations run explicitly, not on container startup. The TiDB test database was
prepared separately; a new database must be migrated and have CHECK support
enabled as described in `tidb-deployment.md`. An empty database has no previous
users, admin account or learning content. Import existing data deliberately after
backing it up, or use the existing admin creation command in `ADMIN.md`.

After a test deployment succeeds, verify:
- `/health` and `/health/ready` respond with `{"status":"ok"}`.
- Reloading `/admin`, `/on-tap`, and `/tu-dien-ky-hieu` serves the application.
- Missing `/api/...` paths return API errors, not frontend HTML.
- Login, logout, profile changes, Google OTP, and Brevo delivery work over HTTPS.
- AI inference loads the trained model and video conversion can execute FFmpeg.

## Remaining work before a full release

- Existing media upload and gesture video conversion send files through the
  backend. Vercel's function request/response size limits still apply to Container
  Runtime. Files exceeding the platform limit need direct Cloudinary upload;
  adding this configuration does not change that upload flow.
- Login/registration rate limiting currently uses in-process memory. Multiple
  cloud instances do not share that state; persistent limits are needed for a
  public release.
- A local Docker build and schema validation do not verify Vercel's actual image
  build, registry optimization limits, cold starts or account quotas. Inspect the
  first cloud build and runtime logs before declaring deployment successful.
- Backups, restore verification, actual data migration, and full user-flow checks
  remain required before storing important user data in the deployment.

## Troubleshooting: Vercel expects port 80 but detects port 8000

The old image used a hardcoded Uvicorn port. The Docker command now expands
`${PORT:-8000}` and uses `exec` so Uvicorn receives shutdown signals directly.
Publish this Dockerfile change through `qnhu` and merge it into the personal fork's
production branch, then wait for the new deployment. Check `/health` first, then
`/health/ready`. A successful build alone does not verify either endpoint.

For the previously deployed image, the immediate workaround is to set project
environment variable `PORT=8000` for Production and redeploy. Editing an environment
variable does not change an existing deployment. Keep this value when deploying
the corrected Dockerfile if the Vercel runtime does not supply a port automatically.
