/**
 * In-memory replacement for DynamoDB, used for the Codesphere PoC.
 *
 * The original implementation talks to DynamoDB (AWS, or dynamodb-local via
 * Docker) through the AWS SDK. Codesphere workspaces are rootless and have no
 * Docker daemon, so this PoC keeps state in process memory instead. That also
 * removes the need for a second service in the Landscape and keeps the app on a
 * single port.
 *
 * State is intentionally NOT persisted: a restart or redeploy of the service
 * drops all groups. Acceptable for a PoC, not for production.
 */

export interface StoredItem {
  primaryKey: string;
  ttl?: number;
  [key: string]: unknown;
}

const items = new Map<string, StoredItem>();

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const isExpired = (item: StoredItem): boolean =>
  typeof item.ttl === 'number' && item.ttl * 1000 <= Date.now();

export const readItem = <T>(primaryKey: string): T | undefined => {
  const item = items.get(primaryKey);
  if (!item) return undefined;
  if (isExpired(item)) {
    items.delete(primaryKey);
    return undefined;
  }
  return clone(item) as T;
};

export const writeItem = (item: StoredItem): void => {
  items.set(item.primaryKey, clone(item));
};

/**
 * Mimics DynamoDB's UpdateItem: creates the item when it does not exist yet and
 * returns the updated item ("ReturnValues: ALL_NEW").
 */
export const mutateItem = <T>(primaryKey: string, mutate: (item: StoredItem) => void): T => {
  const existing = items.get(primaryKey);
  if (existing && isExpired(existing)) {
    items.delete(primaryKey);
  }
  const item = items.get(primaryKey) ?? { primaryKey };
  mutate(item);
  items.set(primaryKey, item);
  return clone(item) as T;
};

export const deleteItem = (primaryKey: string): void => {
  items.delete(primaryKey);
};

// DynamoDB deletes expired items via its TTL feature; do the same lazily here.
const sweep = () => {
  for (const [key, item] of items) {
    if (isExpired(item)) items.delete(key);
  }
};

const timer = setInterval(sweep, 60_000);
timer.unref?.();
