---
name: Supabase connector and schema setup
description: The connected Supabase application proxy exposes PostgREST data access, not arbitrary SQL DDL.
---

Use the Supabase connection for application data requests, but keep schema creation and migrations as an explicit SQL Editor or migration step.

**Why:** A connected Supabase project can be reachable while a required table is still absent; PostgREST returns a schema-cache/table-not-found error and cannot create the table itself.

**How to apply:** Keep the migration SQL in the repository, surface an actionable setup error from the API, and verify the table exists before diagnosing CRUD or authentication code.