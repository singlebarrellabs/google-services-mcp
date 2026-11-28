# Spike: Google Workspace MCP endpoints

Started 2026-11-27, validated the same day. Status: partial. `tools/list` and
auth metadata done; host tests pending (need an agent-flagged OAuth client).

## Method

`tools/list` is accepted without credentials, so the surface can be enumerated
directly. Tool calls are not open.

```bash
curl -s https://gmailmcp.googleapis.com/mcp/v1 \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Tool surface, measured 2026-11-27

| Endpoint | `/mcp/v1` | read-only | `/mcp/v1self` |
| --- | --- | --- | --- |
| gmailmcp | 30 | 7 | 25 |
| drivemcp | 15 | 9 | 12 |
| calendarmcp | 9 | 5 | 8 |
| chatmcp | 9 | 5 | 8 |
| sheetsmcp | 9 | 2 | 9 |
| tasksmcp | 9 | 3 | 8 |
| slidesmcp | 4 | 3 | 4 |
| people | 3 | 3 | none (404) |
| docsmcp | 2 | 1 | 2 |
| workspacemcp | 1 | 1 | n/a |
| **total** | **91** | **39** | **76** |

Every tool on `/mcp/v1` carries annotations: `readOnlyHint`, `destructiveHint`,
`idempotentHint`, `title`. No tool is missing them.

### What `/mcp/v1self` drops

Exactly the approval-gated tools:

- gmail: `send_message`, `reply`, `forward`, `apply_sensitive_thread_label`,
  `apply_sensitive_message_label`
- drive: `list_shared_drives`, `request_access`, `upload_file_revision`
- calendar: `delete_event`
- chat: `send_message`
- tasks: `delete_task`

So `v1self` is the no-human-in-the-loop variant. It is a downgrade, not a
neutral alias, and the plan treats it that way.

## Auth metadata

An unauthenticated `tools/call` returns `401` with:

```http
www-authenticate: Bearer resource_metadata="https://gmailmcp.googleapis.com/.well-known/oauth-protected-resource/search_threads"
```

That document advertises `authorization_servers: ["https://accounts.google.com/"]`
and five Gmail scopes: `mail.google.com`, `gmail.messages`,
`gmail.messages.readonly`, `gmail.modify`, `gmail.readonly`.

`https://accounts.google.com/.well-known/oauth-authorization-server` returns
`issuer`, `authorization_endpoint`, `token_endpoint`, and
`code_challenge_methods_supported: ["plain","S256"]` — but **no
`registration_endpoint`**. Dynamic client registration is unavailable, so every
host needs a pre-registered client ID and a fixed redirect URI. That is the
single biggest constraint on the bridge.

## What this changes

1. **Coverage is near parity.** Gmail 30 vs 29 here, Drive 15 vs 15, Tasks 9 vs
   9, Calendar 9 vs 12, Chat 9 (this package has none). Sheets, Docs and Slides
   expose `batchUpdate` passthroughs, so one tool covers many edits — notably
   `update_file` takes `parentId`, so moving a Drive file is covered, and
   `update_presentation` creates slides.
2. **The pre-registered-client requirement is confirmed, not assumed.** No DCR
   on Google's authorization server. OpenCode and Claude Code both accept
   pre-registered credentials, but a fixed callback port must be registered.
3. **`/mcp/v1self` is not a free fallback.** It removes 15 tools including
   Gmail send, Chat send and Calendar delete.
4. **The published tool tables are not stable.** An early read of the Gmail
   reference listed ten tools; the same page later listed 30, matching the live
   endpoint. Enumerate every time.

## Gaps that remain

Gmail attachments, send-as, vacation, filter update/delete, label delete; Drive
share, permission delete, export, untrash, permanent delete; Calendar
create/update/delete calendar; Contacts create/update/delete; creating a
document, spreadsheet or presentation; Forms; YouTube.

## Still unknown (blocked on S-1)

- Whether a Desktop-app client is accepted for these endpoints, or only a Web
  client with a registered HTTPS redirect.
- Whether one token spans endpoints, or each product endpoint needs its own
  consent.
- Whether `/mcp/v1` approvals render in OpenCode and Claude Code.
- Whether consumer `@gmail.com` accounts are eligible.

## Next

Create the agent-flagged OAuth client (S-1), then run S-2 through S-7.
