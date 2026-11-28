/**
 * Service filtering for the tool registry.
 *
 * Hosts that load every tool definition into every request pay for the whole
 * 134-tool surface. `--services gmail,calendar` registers a subset, chosen by
 * the `google_<domain>_<action>` naming convention.
 */

export const VALID_SERVICES = [
  "account",
  "calendar",
  "contacts",
  "docs",
  "drive",
  "forms",
  "gmail",
  "sheets",
  "slides",
  "tasks",
  "youtube",
] as const;

export type ServiceName = (typeof VALID_SERVICES)[number];

/**
 * Parse a comma-separated service list. Throws on an unknown name or an empty
 * selection — silently registering nothing would look like a broken server.
 */
export function parseServices(raw: string): ReadonlySet<ServiceName> {
  const parts = raw
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    throw new Error(`--services needs at least one service: ${VALID_SERVICES.join(", ")}`);
  }

  const selected = new Set<ServiceName>();
  for (const part of parts) {
    if (!(VALID_SERVICES as readonly string[]).includes(part)) {
      throw new Error(`Unknown service: ${part}. Valid services: ${VALID_SERVICES.join(", ")}`);
    }
    selected.add(part as ServiceName);
  }
  return selected;
}

/**
 * True when `name` belongs to an enabled service. No filter means everything is
 * enabled, so existing installs behave exactly as before.
 */
export function isToolEnabled(name: string, services?: ReadonlySet<ServiceName>): boolean {
  if (services === undefined) return true;
  const [, domain] = name.split("_");
  return domain !== undefined && (services as ReadonlySet<string>).has(domain);
}
