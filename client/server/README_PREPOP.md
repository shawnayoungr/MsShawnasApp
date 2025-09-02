PREPOP-only server behavior

This server is configured to run in LOCAL-ONLY mode. PREPOP (`prepopulated-careers.json`) is the single source of truth.

What this means:
- All endpoints under `/api/careers/careeronestop/*` return data only from `prepopulated-careers.json`.
- Upstream CareerOneStop API calls, web-scrape fallbacks, telemetry writes, and enrichment routines are disabled by default to avoid runtime network dependencies.
- `GET /local/missing` returns an empty list (missing-fields check is disabled).
- `POST /admin/enrich` returns 403 (enrichment disabled).

To re-enable enrichment/upstream behavior:
- Reintroduce the API credentials (CAREERONESTOP_USER_ID and CAREERONESTOP_TOKEN).
- Restore or re-enable `enrichPrepop()` calls and web fallback helpers (not recommended for local-only deployments).

This file is informational and safe to keep with the server code.
