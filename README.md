# gotovo-frontend — moved

This repository is **archived and read-only**. Development continues in the
monorepo:

## → https://github.com/naborka/gotovo

The Next.js application now lives at **`apps/web/`** there, alongside the Rust
API (`apps/api/`) and the admin console (`apps/admin/`).

## Why

The two repositories shared one API contract but had no way to enforce it. This
repository carried a vendored copy of the backend's OpenAPI spec that had
already drifted — 1334 lines against the canonical 852, still describing
endpoints from an implementation retired long before — and nothing compared
them. In the monorepo there is one spec, and CI fails when the generated types
drift from it.

Full reasoning: `docs/adr/0001-monorepo-layout.md` and
`docs/adr/0002-single-api-contract.md` in the monorepo.

## History

Every commit here is preserved and remains browsable. The monorepo starts from a
fresh root commit, so this repository is the record of the frontend's history
before the merge.

Open issues and pull requests should be recreated against the monorepo.
