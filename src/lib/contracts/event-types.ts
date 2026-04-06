export type JsonSafeValue =
  | string
  | number
  | boolean
  | null
  | JsonSafeValue[]
  | { [key: string]: JsonSafeValue };

export interface IndexedEvent {
  eventName: string;
  signature: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
  logIndex: number;
  id: string;
  args: Record<string, JsonSafeValue>;
}

export interface IndexerCursor {
  lastIndexedBlock: string;
  indexedAt: string;
  totalEvents: number;
}

export interface EventSnapshot {
  cursor: IndexerCursor;
  events: IndexedEvent[];
}
