# Spike: Google Workspace MCP endpoints

Started 2026-11-27. Status: partial. `tools/list` done; OAuth and host tests
pending (need an agent-flagged OAuth client).

## Method

`tools/list` is accepted without credentials on the public MCP endpoints, so
the tool surface can be enumerated directly:

```bash
curl -s https://gmailmcp.googleapis.com/mcp/v1 \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Every endpoint below answered `200` with a JSON-RPC result, no
`www-authenticate` header. Actual tool calls still require OAuth; only
enumeration is open.

## Tool surface, measured 2026-11-27

| Endpoint | Tools | Read-only |
| --- | --- | --- |
| `gmailmcp.googleapis.com/mcp/v1` | 30 | 7 |
| `drivemcp.googleapis.com/mcp/v1` | 15 | 9 |
| `calendarmcp.googleapis.com/mcp/v1` | 9 | 5 |
| `chatmcp.googleapis.com/mcp/v1` | 9 | 5 |
| `sheetsmcp.googleapis.com/mcp/v1` | 9 | 2 |
| `tasksmcp.googleapis.com/mcp/v1` | 9 | 3 |
| `slidesmcp.googleapis.com/mcp/v1` | 4 | 3 |
| `people.googleapis.com/mcp/v1` | 3 | 3 |
| `docsmcp.googleapis.com/mcp/v1` | 2 | 1 |
| `workspacemcp.googleapis.com/mcp/v1` | 1 | 1 |
| **total** | **91** | **39** |

### Names as served

- **gmail** — `create_draft`, `update_draft`, `send_message`, `reply`,
  `forward`, `list_drafts`*, `get_draft`*, `get_thread`*, `get_message`*,
  `search_threads`*, `label_thread`, `unlabel_thread`,
  `apply_sensitive_thread_label`, `trash_thread`, `untrash_thread`,
  `mark_thread_spam`, `unmark_thread_spam`, `list_labels`*, `label_message`,
  `update_message_labels`, `unlabel_message`, `apply_sensitive_message_label`,
  `trash_message`, `untrash_message`, `mark_message_spam`,
  `unmark_message_spam`, `create_label`, `create_filter`, `update_label`,
  `list_filters`*
- **drive** — `copy_file`, `create_file`, `download_file_content`*,
  `get_file_metadata`*, `get_file_permissions`*, `get_shared_drive_metadata`*,
  `list_file_revisions`*, `list_recent_files`*, `list_shared_drives`*,
  `read_file_content`*, `request_access`, `search_files`*, `trash_file`,
  `update_file`, `upload_file_revision`
- **calendar** — `list_events`*, `get_event`*, `list_calendars`*,
  `suggest_time`*, `create_event`, `update_event`, `delete_event`,
  `respond_to_event`, `search_events`*
- **chat** — `list_messages`*, `search_messages`*, `search_conversations`*,
  `send_message`, `list_memberships`*, `mark_as_read`, `mark_as_unread`,
  `update_notification_settings`, `get_notification_settings`*
- **sheets** — `get_values`*, `get_spreadsheet`*, `update_spreadsheet`,
  `update_values`, `update_formulas`, `insert_dimension`,
  `copy_sheet_to_another_spreadsheet`, `batch_clear_values`, `append_values`
- **tasks** — `list_task_lists`*, `list_tasks`*, `get_task`*, `create_task`,
  `update_task`, `delete_task`, `undelete_task`, `complete_task`,
  `uncomplete_task`
- **slides** — `read_presentation`*, `read_slide_page`*,
  `read_slide_page_thumbnail`*, `update_presentation`
- **docs** — `read_doc`*, `update_doc`
- **people** — `search_directory_people`*, `search_contacts`*,
  `get_user_profile`*
- **workspace (universal search)** — `search_corpus`*

`*` = `annotations.readOnlyHint: true`.

## What this changes

1. **Google's docs are stale.** The published Gmail MCP reference lists ten
   tools. The live server serves 30, including `send_message`, `reply` and
   `forward`. Planning from the docs pages produced a wrong conclusion about
   Gmail send; `tools/list` is the authority.
2. **Coverage is close to parity for the big surfaces.** Gmail 30 vs 29 here,
   Drive 15 vs 15, Tasks 9 vs 9. The bridge is more viable than the docs
   suggested.
3. **Annotations are present and usable.** Every tool carries `readOnlyHint`,
   `destructiveHint`, `idempotentHint`, `title`. Clients that filter or badge
   by annotation (Claude Code read-only sessions) will behave sensibly.
4. **Gaps that remain:** Gmail attachments, send-as, vacation, filter
   delete/update, label delete; Drive share, permission delete, move, export,
   restore; Calendar create/update/delete calendar; Contacts write; Docs write
   beyond `update_doc`; Slides creation and slide-level edits; Forms; YouTube.

## Still unknown (blocked on S-1)

- Whether a pre-registered Desktop client is accepted, and whether OpenCode
  can use one (no dynamic registration assumed).
- Whether one token spans endpoints.
- Whether `/mcp/v1` approvals (form elicitation) render in OpenCode and
  Claude Code, or `/mcp/v1self` must be used.
- What scopes a tool call requires, and whether `send_message` needs extra
  consent beyond `gmail.modify`.
- Whether consumer `@gmail.com` accounts are eligible.

## Next

Create the agent-flagged OAuth client (S-1), then run S-2 through S-7.
