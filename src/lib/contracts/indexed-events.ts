import type { IndexedEvent, JsonSafeValue } from "./event-types";

export function eventId(transactionHash: string, logIndex: number) {
  return `${transactionHash}:${logIndex}`;
}

export function toJsonSafe(value: unknown): JsonSafeValue {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toJsonSafe(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        toJsonSafe(entry),
      ]),
    );
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return String(value);
}

export function serializeArgs(
  args: Record<string, unknown> | readonly unknown[] | null | undefined,
): Record<string, JsonSafeValue> {
  if (!args) {
    return {};
  }

  const normalizedArgs = Array.isArray(args)
    ? Object.fromEntries(args.map((value, index) => [String(index), value]))
    : args;

  return Object.fromEntries(
    Object.entries(normalizedArgs).map(([key, value]) => [
      key,
      toJsonSafe(value),
    ]),
  );
}

export function mergeIndexedEvents(
  existingEvents: IndexedEvent[],
  nextEvents: IndexedEvent[],
) {
  const merged = new Map<string, IndexedEvent>();

  for (const event of [...existingEvents, ...nextEvents]) {
    if (!merged.has(event.id)) {
      merged.set(event.id, event);
    }
  }

  return [...merged.values()].sort((left, right) => {
    const blockDiff = BigInt(left.blockNumber) - BigInt(right.blockNumber);

    if (blockDiff !== 0n) {
      return blockDiff < 0n ? -1 : 1;
    }

    return left.logIndex - right.logIndex;
  });
}
