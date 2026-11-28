# Tool mapping: this server → Google Workspace MCP

Draft for Phase 5 (B-3). Written 2026-11-27, before any bridge code.

Sources: local tool registry (`src/tools/index.ts`, 134 tools) and live
`tools/list` output from the ten Google endpoints (91 tools), enumerated the
same day. See `google-mcp-spike.md` for the raw surface.

Legend:

- **direct** — one Google tool maps to one local tool, same semantics.
- **composite** — one Google tool covers it with different arguments, usually a
  `batchUpdate` passthrough. Behaviour is compatible; the call shape is not.
- **partial** — Google tool exists but does less (e.g. list capped, no permanent
  delete). Bridging would silently reduce capability.
- **none** — no Google equivalent. Stays on REST.

## Summary

| Domain | Local | Direct | Composite | Partial | None |
| --- | --- | --- | --- | --- | --- |
| Gmail | 29 | 18 | 1 | 1 | 9 |
| Drive | 15 | 8 | 3 | 1 | 3 |
| Calendar | 12 | 7 | 2 | 0 | 3 |
| Sheets | 13 | 5 | 5 | 1 | 2 |
| Slides | 11 | 2 | 8 | 0 | 1 |
| Docs | 9 | 1 | 7 | 0 | 1 |
| Tasks | 9 | 6 | 1 | 0 | 2 |
| Contacts | 6 | 1 | 2 | 0 | 3 |
| YouTube | 15 | 0 | 0 | 0 | 15 |
| Forms | 10 | 0 | 0 | 0 | 10 |
| account | 5 | 0 | 0 | 0 | 5 |
| **total** | **134** | **48** | **29** | **3** | **54** |

Bridge-servable: **80 tools** (48 direct + 29 composite + 3 partial).
Not servable: **54** (YouTube 15, Forms 10, account 5, plus 24 Workspace gaps).

## Gmail — 29 local, 30 available

| Local | Google | Kind |
| --- | --- | --- |
| `google_gmail_send` | `send_message` | direct |
| `google_gmail_reply` | `reply` | direct |
| `google_gmail_get` | `get_message` | direct |
| `google_gmail_list` | `search_threads` | direct |
| `google_gmail_threads_list` | `search_threads` | direct |
| `google_gmail_threads_get` | `get_thread` | direct |
| `google_gmail_modify` | `label_message`, `unlabel_message`, `update_message_labels` | direct |
| `google_gmail_trash` | `trash_message` | direct |
| `google_gmail_untrash` | `untrash_message` | direct |
| `google_gmail_drafts_create` | `create_draft` | direct |
| `google_gmail_drafts_update` | `update_draft` | direct |
| `google_gmail_drafts_list` | `list_drafts` | direct |
| `google_gmail_drafts_get` | `get_draft` | direct |
| `google_gmail_labels_list` | `list_labels` | direct |
| `google_gmail_labels_create` | `create_label` | direct |
| `google_gmail_labels_update` | `update_label` | direct |
| `google_gmail_filters_create` | `create_filter` | direct |
| `google_gmail_filters_list` | `list_filters` | direct |
| `google_gmail_drafts_send` | `send_message` | composite |
| `google_gmail_delete` | `trash_message` | partial |
| `google_gmail_drafts_delete` | — | none |
| `google_gmail_labels_delete` | — | none |
| `google_gmail_filters_delete` | — | none |
| `google_gmail_list_attachments` | — | none |
| `google_gmail_get_attachment` | — | none |
| `google_gmail_sendas_create` | — | none |
| `google_gmail_sendas_list` | — | none |
| `google_gmail_vacation_get` | — | none |
| `google_gmail_vacation_update` | — | none |

Note: `send_message` is approval-gated on `/mcp/v1` and absent from
`/mcp/v1self`. Bridging send means bridging approvals, not just the call.

## Drive — 15 local, 15 available

| Local | Google | Kind |
| --- | --- | --- |
| `google_drive_copy` | `copy_file` | direct |
| `google_drive_get` | `get_file_metadata` | direct |
| `google_drive_download` | `download_file_content` | direct |
| `google_drive_upload` | `create_file` | direct |
| `google_drive_update` | `update_file` | direct |
| `google_drive_trash` | `trash_file` | direct |
| `google_drive_list_permissions` | `get_file_permissions` | direct |
| `google_drive_list` | `search_files`, `list_recent_files` | direct |
| `google_drive_move` | `update_file` (`parentId`) | composite |
| `google_drive_create_folder` | `create_file` (folder MIME) | composite |
| `google_drive_export` | `read_file_content` | composite |
| `google_drive_delete` | `trash_file` | partial |
| `google_drive_share` | — | none |
| `google_drive_delete_permission` | — | none |
| `google_drive_restore` | — | none |

## Calendar — 12 local, 9 available

| Local | Google | Kind |
| --- | --- | --- |
| `google_calendar_create_event` | `create_event` | direct |
| `google_calendar_get_event` | `get_event` | direct |
| `google_calendar_update_event` | `update_event` | direct |
| `google_calendar_delete_event` | `delete_event` | direct |
| `google_calendar_list_events` | `list_events` | direct |
| `google_calendar_list_calendars` | `list_calendars` | direct |
| `google_calendar_respond` | `respond_to_event` | direct |
| `google_calendar_free_busy` | `suggest_time` | composite |
| `google_calendar_create_meet` | `create_event` (conference data) | composite |
| `google_calendar_create` | — | none |
| `google_calendar_update` | — | none |
| `google_calendar_delete` | — | none |

`delete_event` is approval-gated and absent from `/mcp/v1self`.

## Sheets — 13 local, 9 available

| Local | Google | Kind |
| --- | --- | --- |
| `google_sheets_read` | `get_values` | direct |
| `google_sheets_get` | `get_spreadsheet` | direct |
| `google_sheets_write` | `update_values` | direct |
| `google_sheets_append` | `append_values` | direct |
| `google_sheets_batch_update` | `update_spreadsheet` | direct |
| `google_sheets_add_sheet` | `update_spreadsheet` | composite |
| `google_sheets_delete_sheet` | `update_spreadsheet` | composite |
| `google_sheets_rename_sheet` | `update_spreadsheet` | composite |
| `google_sheets_insert_rows` | `insert_dimension` | composite |
| `google_sheets_delete_rows` | `update_spreadsheet` | composite |
| `google_sheets_set_named_range` | `update_spreadsheet` | partial |
| `google_sheets_create` | — | none |
| `google_sheets_get_named_ranges` | — | none |

## Slides — 11 local, 4 available

| Local | Google | Kind |
| --- | --- | --- |
| `google_slides_get` | `read_presentation` | direct |
| `google_slides_get_page` | `read_slide_page` | direct |
| `google_slides_add_slide` | `update_presentation` | composite |
| `google_slides_delete_slide` | `update_presentation` | composite |
| `google_slides_move_slide` | `update_presentation` | composite |
| `google_slides_duplicate_slide` | `update_presentation` | composite |
| `google_slides_replace_text` | `update_presentation` | composite |
| `google_slides_create_textbox` | `update_presentation` | composite |
| `google_slides_create_image` | `update_presentation` | composite |
| `google_slides_batch_update` | `update_presentation` | composite |
| `google_slides_create` | — | none |

## Docs — 9 local, 2 available

| Local | Google | Kind |
| --- | --- | --- |
| `google_docs_read` | `read_doc` | direct |
| `google_docs_get` | `read_doc` | composite |
| `google_docs_insert_text` | `update_doc` | composite |
| `google_docs_replace_text` | `update_doc` | composite |
| `google_docs_insert_table` | `update_doc` | composite |
| `google_docs_insert_inline_image` | `update_doc` | composite |
| `google_docs_delete_range` | `update_doc` | composite |
| `google_docs_batch_update` | `update_doc` | composite |
| `google_docs_create` | — | none |

## Tasks — 9 local, 9 available

| Local | Google | Kind |
| --- | --- | --- |
| `google_tasks_create` | `create_task` | direct |
| `google_tasks_list` | `list_tasks` | direct |
| `google_tasks_complete` | `complete_task` | direct |
| `google_tasks_delete` | `delete_task` | direct |
| `google_tasks_update` | `update_task` | direct |
| `google_tasks_list_lists` | `list_task_lists` | direct |
| `google_tasks_delete_list` | `delete_task` | composite |
| `google_tasks_create_list` | — | none |
| `google_tasks_update_list` | — | none |

`delete_task` is approval-gated and absent from `/mcp/v1self`. Note this
package calls a tool list a task list; `delete_list` bridged to `delete_task`
must loop, so it is composite, not direct.

## Contacts — 6 local, 3 available

| Local | Google | Kind |
| --- | --- | --- |
| `google_contacts_search` | `search_contacts` | direct |
| `google_contacts_get` | `search_contacts` | composite |
| `google_contacts_list` | `search_contacts` | composite |
| `google_contacts_create` | — | none |
| `google_contacts_update` | — | none |
| `google_contacts_delete` | — | none |

## Not servable at all

- **YouTube, 15 tools.** Not a Workspace API. Outside the Addendum and outside
  tiering. No reason to change.
- **Forms, 10 tools.** Workspace API, no Google MCP. Real exposure with no
  compliant path.
- **account, 5 tools.** Local concept; the bridge keeps its own multi-account
  layer and never proxies these.

## Consequences for Phase 5

1. **The bridge is worth more than the plan assumed: 80 of 134 tools.** The
   earlier estimate of 36 came from counting Google's *documented* tool names,
   which undercounted composite coverage badly.
2. **Read-only first covers 39 Google tools, not 80 local tools.** Several local
   tools map onto one `batchUpdate` tool, so the read pass reaches further than
   the Google count suggests, but write coverage is where the parity lives.
3. **Approval-gated tools are the fork in the road.** `send_message`,
   `delete_event`, `delete_task`, `request_access` exist only on `/mcp/v1`. A
   bridge that cannot relay elicitation loses them entirely.
4. **Permanent delete and sharing are the honest gaps.** Users who need
   `google_drive_share`, `google_drive_delete_permission`, attachment download,
   or Send-As stay on REST whatever happens.
