# Plan: Google Workspace API tiers and the MCP requirement (2026–2027)

Status: draft for review. No code written. Owner: maintainer.
Covers: `google-services-mcp`, `google-workspace-admin-mcp`.
Created: 2026-11-27. Review against Google policy again before 2027-01-15.

## Why this exists

Google's 2026-11-24 notice and the Workspace AI Tools Addendum change what an
AI agent may do with these packages' underlying REST APIs:

| Date | Change |
| --- | --- |
| 2026-11-24 | Standard and Scaled tiers live; users' projects rate-limited by default |
| 2027-02-01 | MCP requirement enforced; agent use over REST is non-compliant |
| 2027-04-01 | Scaled billing starts; not reachable for REST agent use |

Two facts drive every decision below.

1. **The user owns the project.** Both packages ship BYO OAuth client, so the
   tier, the quota, and the compliance exposure land on the person running it.
   The maintainer's obligation is disclosure, not procurement.
2. **Google's Gmail MCP has no send tool.** Ten tools, draft-first. There is no
   compliant replacement for `google_gmail_send`, `google_gmail_reply`, or
   attachments, so no bridge can preserve those tools.

Scope surfaces (134 tools): Gmail 29, Drive 15, Calendar 12, Sheets 13, Slides
11, Forms 10, Tasks 9, Docs 9, Contacts 6, account 5, YouTube 15.

## Decisions already taken

- **D1.** Documentation first. It is the only certainly-needed work.
- **D2.** No bridge until a hands-on spike proves the OAuth path works.
- **D3.** If built, the bridge is a **read-only subset** (about 36 tools), not a
  134-tool rewrite.
- **D4.** Gmail send, reply and attachments are documented as having no
  compliant path. They are never "bridged".
- **D5.** YouTube is out of scope: not a Workspace API, outside the Addendum.
- **D6.** Admin plane gets documentation only. No code while no Google MCP
  covers those surfaces.
- **D7.** No pricing, packaging, or customer analysis. MIT, no revenue.

## Phase 0 — Baseline (0.5 day)

- **P0-1.** Open the Workspace API usage dashboard for `double-backup-438` and
  `opencode-mcp-498623`. Record daily usage per product, per project.
- **P0-2.** Confirm both projects are on Standard tier, not Scaled.
- **P0-3.** Snapshot tool counts and scopes from `src/tools/index.ts` and
  `src/auth/config.ts`. Confirm they match the numbers above.
- **P0-4.** Confirm whether consumer `@gmail.com` accounts can enable Google
  MCP. Record the answer and its source.

Exit: a one-page baseline in `docs/research/google-api-baseline.md`. No further
action if every project is under 5,000 requests/day/product.

## Phase 1 — Disclosure patch (0.5 day, both repos)

README is a published file (`files: [dist, README.md, LICENSE]`), so this phase
**ships a version**. Batch it with Phase 4 to avoid burning a release.

### `google-services-mcp`

- **R-1.** Add a section "Google Workspace API changes (2026–2027)" after
  Requirements. Cover dates, tiers, 5,000/day/project/product, and link
  Google's quota page and the Workspace AI Tools Addendum.
- **R-2.** State the agent/REST position plainly: agent use over REST is
  non-compliant from 2027-02-01. One short paragraph, no hedging.
- **R-3.** State the Gmail gap: Google's MCP offers draft, not send. Name the
  affected tools (`send`, `reply`, `get_attachment`, `drafts_send`).
- **R-4.** Per-service coverage note: which services have a Google MCP and
  which do not. Name YouTube and Forms as having none.
- **R-5.** Correct the multi-account claim: clients can register the same
  endpoint twice with separate logins, so `account` is convenience, not a
  unique capability.
- **R-6.** Add "Last reviewed against Google Workspace API policy: 2026-11-27"
  under the title. Update on each policy review.

### `google-workspace-admin-mcp`

- **A-1.** Add a "Compliance posture" section: Admin SDK is a Workspace API and
  the Addendum applies; no Google MCP covers admin surfaces; admin APIs are not
  tiered yet; enforcement has no path today.
- **A-2.** State the risk without over-claiming: behavior may change when
  Google extends tiering or ships an admin MCP.
- **A-3.** Add the same review-date line.

Copy rules: markdownlint is the authority; keep lines at 100 characters or
fewer. Do not let Biome format Markdown. Verify with `npm run lint` per repo.

Exit: `npm run lint` green in both repos; diffs are documentation only.

## Phase 2 — Spike, Google MCP from real hosts (1 day, timeboxed)

Goal: answer five questions. This is not an implementation task.

- **S-1.** Create an agent-flagged OAuth client (Personal mode onboarding) with
  a **fixed** loopback callback port. Record client ID and port; keep the secret
  in an environment variable, never in a file.
- **S-2.** OpenCode: add `gmailmcp` as `type: "remote"` with
  `oauth: { clientId, clientSecret }`. `opencode mcp list` shows connected.
- **S-3.** OpenCode: connect `/mcp/v1`, list tools, call one read tool. Capture
  the tool list.
- **S-4.** OpenCode: repeat against `/mcp/v1self` for Gmail and Calendar.
  Record the difference between the two endpoints.
- **S-5.** Claude Code: `claude mcp add --transport http --client-id ...
  --callback-port <port>`, then Authenticate from `/mcp`.
- **S-6.** Test whether one token is accepted by both `gmailmcp` and
  `calendarmcp`. Record per-endpoint or shared audience.
- **S-7.** Check whether Google's approval (elicitation) prompts render in each
  host. Record per host.
- **S-8.** Write `docs/research/google-mcp-spike.md` with commands and outputs.
  No secrets, no tokens, no project IDs beyond the two public ones.

Stop conditions. Record and stop; do not work around:

- Neither host accepts a pre-registered client without dynamic registration.
- Google rejects a Desktop-app client for MCP and requires a Web client whose
  redirect URI cannot be registered on a loopback port.
- One token cannot span endpoints and per-endpoint auth makes a local proxy
  unusable.

Effort: one focused day. Anything longer means the answer is "not now".

Exit: spike note exists with a clear pass or fail on each question.

## Phase 3 — Decision gate (30 minutes)

Pass requires all four:

- OAuth works in at least one host without hacks (S-2 or S-5 connected).
- The token story is usable by a local proxy (S-6 answered either way, with a
  workaround if per-endpoint).
- Approvals render, or `/mcp/v1self` is acceptable (S-7 answered).
- Read coverage justifies the work: at least 25 tools map cleanly.

Pass means Phase 5. Fail means close the bridge, ship Phases 1 and 4, stop.

Record the decision and reasons in the spike note. Do not re-litigate without
new evidence.

## Phase 4 — Service subsets (0.5 day, TDD)

Independent of the spike; ships with Phase 1 in one release.

- **F-1.** Test first: `--services gmail,calendar` registers only those
  domains. Watch it fail, then implement.
- **F-2.** Parse and validate the flag. Unknown service is an error listing the
  valid names; unit test covers a typo.
- **F-3.** Decide whether the selection persists in
  `~/.google-services-mcp/config.json`. Record the decision either way.
- **F-4.** README: explain why this exists — tool-schema cost in hosts that
  load every definition into every request.
- **F-5.** `docs/TOOLS.md`: note the domain prefixes usable with the flag.

Default stays "all services" so existing installs do not change.

## Phase 5 — Bridge, read-only subset (only if Phase 3 passes; ~2 weeks)

Not started without a green gate. Scope is fixed to read tools; writes stay on
REST and stay documented as non-compliant for agent use.

- **B-1.** Transport module: Streamable HTTP MCP client per Google endpoint.
- **B-2.** Auth: reuse the token store, one credential per account and endpoint.
- **B-3.** Tool mapping table for the 36 clean mappings, written before code.
- **B-4.** Elicitation passthrough; default to `/mcp/v1self` when the host
  lacks it.
- **B-5.** Error mapping: Google MCP errors into the existing `err()` shape.
- **B-6.** `--mode google-mcp` flag; default remains `rest`.
- **B-7.** Tests against a local mock MCP server. No live Google in CI.
- **B-8.** Quota note: bridge calls bill to the user's project, per product.
- **B-9.** README: what the bridge does not do — send, attachments, YouTube,
  Forms, admin surfaces.
- **B-10.** Publish the mapping table so users can see what they lose.

Explicit non-goals: write tools, Gmail send, Forms, YouTube, admin surfaces,
caching of Workspace data, any local index.

## Phase 6 — Admin package (documentation only)

Covered by A-1 to A-3. Revisit only if Google ships an admin MCP or extends
tiering to admin APIs. Trigger: check the Workspace release notes monthly.

## Phase 7 — Release (0.5 day)

Trusted publishing only. Never publish from a local shell.

- **P-1.** Branch, draft PR, CI green: lint, test, typecheck, build.
- **P-2.** Install the beta and smoke-test: `npx -y google-services-mcp@beta
  --version`, then one read tool.
- **P-3.** Flip the PR to ready, merge, let CI publish `latest` with tag and
  release.
- **P-4.** Verify the release notes carry the compliance dates.

If Phases 1 and 4 ship together, that is one publish, not two.

## Risks

- **K-1. Google's MCP pages mix "Developer Preview" wording with the GA
  announcement.** Spike confirms the real state; revisit before 2027-02-01.
- **K-2. Google changes the MCP tool surface and breaks a bridge.** Read-only
  subset keeps the blast radius small; no caching.
- **K-3. OpenCode lacks form elicitation.** Default to `/mcp/v1self`.
- **K-4. Docs drift as Google extends tiers to more APIs.** Monthly release
  notes check; the review-date line makes staleness visible.
- **K-5. Splitting README and `--services` into two releases burns a version.**
  Batch them in Phase 7.
- **K-6. Consumer Gmail accounts turn out to be ineligible for Google MCP.**
  P0-4 answers this before Phase 5 starts.

## Out of scope

- Any pricing, packaging, support, or customer analysis.
- Hosting a shared OAuth client or running a hosted endpoint.
- OAuth verification or marketplace work; each user brings a client.
- Rewriting YouTube or Forms.
- Any index, cache, or memory layer over Workspace data (Addendum 2b–2d).
- Chasing parity with Google's tool count. Fewer tools is the point.

## Open questions

- **Q-1.** Can one token span multiple Google MCP endpoints? Resolved by S-6.
- **Q-2.** Do OpenCode and Claude Code render Google's approval prompts?
  Resolved by S-7.
- **Q-3.** Are consumer `@gmail.com` accounts eligible? Resolved by P0-4.
- **Q-4.** Will Forms or admin surfaces get a Google MCP in 2027? Monthly
  check; nothing depends on it.

## Definition of done

- Both READMEs carry the dates, the agent/REST position, and the Gmail gap.
- The spike is written down, including a clear pass or fail.
- Either a gated bridge exists with a published mapping table, or the decision
  to skip it is recorded with reasons.
- `--services` works and does not change default behavior.
- One release, not two.
