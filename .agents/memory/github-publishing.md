---
name: GitHub publishing path
description: Reliable repository publishing approach for this workspace's GitHub connection.
---

When the GitHub connector's REST or native Git Database write endpoints return a Cloudflare HTML block, publish through local git using a workspace secret-backed credential helper instead of repeatedly retrying API writes.

**Why:** The connector can read and create repositories successfully, but rapid file/blob/contents writes may be blocked by the provider's security layer. A normal `git push` through the secret avoids the blocked API path and preserves one clean repository history.

**How to apply:** Keep the repository URL token-free, use the existing workspace secret through a non-printing Git credential helper, fetch/rebase when remote `main` is newer, avoid force-push over user work, then verify the remote ref matches local `HEAD`.