"use client";

import { Box, Center, Container, Spinner, Stack, Text } from "@chakra-ui/react";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  EVENT_CATEGORIES,
  type EventCategory,
} from "@/lib/contracts/event-attribution";
import type { EventAttributionIndex } from "@/lib/contracts/event-attribution";
import { useEventIndex } from "@/hooks/useEventIndex";
import EventFeed from "./event-feed";
import ExplorerHeader from "./explorer-header";
import FilterBar from "./filter-bar";

interface ExplorerPageProps {
  attributionIndex: EventAttributionIndex;
}

function ExplorerContent({ attributionIndex }: ExplorerPageProps) {
  const {
    currentBlock,
    error,
    events,
    isCatchingUp,
    isLoading,
    isStale,
    snapshotBlock,
  } = useEventIndex();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") as EventCategory | null;
  const activeEvent = searchParams.get("event");
  const activeSignature = searchParams.get("signature");
  const activeModule = searchParams.get("module");
  const filteredEvents = useMemo(() => {
    let nextEvents = events;

    if (activeCategory && activeCategory in EVENT_CATEGORIES) {
      const eventNames = EVENT_CATEGORIES[activeCategory] as readonly string[];

      nextEvents = nextEvents.filter((event) =>
        eventNames.includes(event.eventName),
      );
    }

    if (activeEvent) {
      nextEvents = nextEvents.filter(
        (event) => event.eventName === activeEvent,
      );
    }

    if (activeSignature) {
      nextEvents = nextEvents.filter(
        (event) => event.signature === activeSignature,
      );
    }

    if (activeModule) {
      nextEvents = nextEvents.filter((event) => {
        const attribution = attributionIndex[event.signature];

        return (
          attribution?.moduleLinks.some(
            (moduleLink) => moduleLink.facetName === activeModule,
          ) ?? false
        );
      });
    }

    return [...nextEvents].reverse();
  }, [
    activeCategory,
    activeEvent,
    activeModule,
    activeSignature,
    attributionIndex,
    events,
  ]);

  if (isLoading) {
    return (
      <Center py="24">
        <Stack align="center" gap="4">
          <Spinner size="lg" />
          <Text color="fg.muted">Loading protocol events…</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center py="24">
        <Stack align="center" gap="2">
          <Text fontWeight="medium" color="fg.error">
            Failed to load event data
          </Text>
          <Text color="fg.muted" fontSize="sm">
            {error.message}
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="8">
      <ExplorerHeader
        currentBlock={currentBlock}
        filteredEvents={filteredEvents.length}
        isCatchingUp={isCatchingUp}
        isStale={isStale}
        snapshotBlock={snapshotBlock}
        totalEvents={events.length}
      />
      <FilterBar />
      <EventFeed attributionIndex={attributionIndex} events={filteredEvents} />
    </Stack>
  );
}

const ExplorerPage = ({ attributionIndex }: ExplorerPageProps) => {
  return (
    <Box as="main">
      <Container
        maxW="6xl"
        px={{ base: "4", md: "8" }}
        py={{ base: "6", md: "8" }}
      >
        <Suspense
          fallback={
            <Center py="24">
              <Spinner size="lg" />
            </Center>
          }
        >
          <ExplorerContent attributionIndex={attributionIndex} />
        </Suspense>
      </Container>
    </Box>
  );
};

export default ExplorerPage;
