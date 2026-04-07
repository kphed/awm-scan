import { NextRequest, NextResponse } from "next/server";
import { fetchLiveEventDelta } from "@/lib/contracts/live-events";
import { createMonyClient } from "@/lib/viem";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
} as const;

function isValidBlockNumber(value: string | null) {
  return value !== null && /^\d+$/u.test(value);
}

export async function GET(request: NextRequest) {
  const snapshotBlock = request.nextUrl.searchParams.get("snapshotBlock");

  if (snapshotBlock === null || !isValidBlockNumber(snapshotBlock)) {
    return NextResponse.json(
      {
        currentBlock: null,
        events: [],
        isStale: false,
      },
      {
        headers: NO_STORE_HEADERS,
        status: 400,
      },
    );
  }

  const validatedSnapshotBlock = snapshotBlock;

  let client: ReturnType<typeof createMonyClient>;

  try {
    client = createMonyClient();
  } catch (err) {
    console.error("[api/events/catchup] RPC client unavailable", { err });

    return NextResponse.json(
      {
        currentBlock: null,
        events: [],
        isStale: false,
      },
      { headers: NO_STORE_HEADERS },
    );
  }

  try {
    const payload = await fetchLiveEventDelta(
      BigInt(validatedSnapshotBlock),
      client,
    );

    return NextResponse.json(payload, { headers: NO_STORE_HEADERS });
  } catch (err) {
    console.error("[api/events/catchup] Failed live event catch-up", {
      snapshotBlock,
      err,
    });

    return NextResponse.json(
      {
        currentBlock: null,
        events: [],
        isStale: true,
      },
      { headers: NO_STORE_HEADERS },
    );
  }
}
