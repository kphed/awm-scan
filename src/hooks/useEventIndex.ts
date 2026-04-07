"use client";

import { useEffect, useState } from "react";
import type { EventCatchupResponse } from "@/lib/contracts/live-events";
import type { EventSnapshot, IndexedEvent } from "@/lib/contracts/event-types";
import { mergeIndexedEvents } from "@/lib/contracts/indexed-events";

const MAX_SNAPSHOT_BYTES = 5_000_000;

export interface UseEventIndexResult {
  currentBlock: string | null;
  error: Error | null;
  events: IndexedEvent[];
  isCatchingUp: boolean;
  isLoading: boolean;
  isStale: boolean;
  snapshotBlock: string;
}

function isEventSnapshot(value: unknown): value is EventSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<EventSnapshot>;

  return (
    typeof candidate.cursor?.lastIndexedBlock === "string" &&
    Array.isArray(candidate.events)
  );
}

function isEventCatchupResponse(value: unknown): value is EventCatchupResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<EventCatchupResponse>;

  return (
    (candidate.currentBlock === null ||
      typeof candidate.currentBlock === "string") &&
    typeof candidate.isStale === "boolean" &&
    Array.isArray(candidate.events)
  );
}

function assertJsonResponse(
  response: Response,
  context: string,
  maxBytes?: number,
) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    throw new Error(`${context} did not return JSON`);
  }

  if (!maxBytes) {
    return;
  }

  const contentLength = response.headers.get("content-length");

  if (contentLength && Number.parseInt(contentLength, 10) > maxBytes) {
    throw new Error(`${context} exceeded the maximum expected size`);
  }
}

export function useEventIndex(): UseEventIndexResult {
  const [events, setEvents] = useState<IndexedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCatchingUp, setIsCatchingUp] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [snapshotBlock, setSnapshotBlock] = useState("0");
  const [currentBlock, setCurrentBlock] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const run = async () => {
      try {
        const snapshotResponse = await fetch("/events/snapshot.json", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!snapshotResponse.ok) {
          throw new Error(`Snapshot fetch failed: ${snapshotResponse.status}`);
        }

        assertJsonResponse(
          snapshotResponse,
          "Snapshot response",
          MAX_SNAPSHOT_BYTES,
        );

        const parsedSnapshot = (await snapshotResponse.json()) as unknown;

        if (!isEventSnapshot(parsedSnapshot)) {
          throw new Error("Snapshot payload is invalid");
        }

        if (!isActive) {
          return;
        }

        setEvents(parsedSnapshot.events);
        setSnapshotBlock(parsedSnapshot.cursor.lastIndexedBlock);
        setIsLoading(false);

        const catchupUrl = `/api/events/catchup?snapshotBlock=${encodeURIComponent(parsedSnapshot.cursor.lastIndexedBlock)}`;

        setIsCatchingUp(true);

        try {
          const catchupResponse = await fetch(catchupUrl, {
            cache: "no-store",
            signal: controller.signal,
          });
          if (!catchupResponse.ok) {
            console.error("[useEventIndex] Catch-up request returned non-OK", {
              status: catchupResponse.status,
            });

            if (isActive) {
              setIsCatchingUp(false);
            }

            return;
          }

          assertJsonResponse(catchupResponse, "Catch-up response");

          const parsedCatchup = (await catchupResponse.json()) as unknown;

          if (!isEventCatchupResponse(parsedCatchup)) {
            throw new Error("Catch-up payload is invalid");
          }

          if (!isActive) {
            return;
          }

          setCurrentBlock(parsedCatchup.currentBlock);
          setIsStale(parsedCatchup.isStale);

          if (parsedCatchup.events.length > 0) {
            setEvents((previousEvents) =>
              mergeIndexedEvents(previousEvents, parsedCatchup.events),
            );
          }

          setIsCatchingUp(false);
        } catch (err) {
          if (controller.signal.aborted) {
            return;
          }

          console.error("[useEventIndex] Catch-up request failed", { err });

          if (isActive) {
            setIsCatchingUp(false);
          }
        }
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("[useEventIndex] Failed to load event index", { err });

        if (!isActive) {
          return;
        }

        setError(
          err instanceof Error ? err : new Error("Failed to load event index"),
        );
        setIsLoading(false);
        setIsCatchingUp(false);
      }
    };

    void run();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  return {
    currentBlock,
    error,
    events,
    isCatchingUp,
    isLoading,
    isStale,
    snapshotBlock,
  };
}
