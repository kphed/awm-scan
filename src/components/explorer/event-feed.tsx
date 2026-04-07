"use client";

import {
  Badge,
  Box,
  Button,
  Code,
  Collapsible,
  HStack,
  Link,
  Separator,
  Stack,
  Text,
  Wrap,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useState } from "react";
import { LuChevronDown, LuExternalLink } from "react-icons/lu";
import type { IndexedEvent } from "@/lib/contracts";
import type { EventAttributionIndex } from "@/lib/contracts/event-attribution";
import { truncateAddress } from "@/lib/format";
import EventArgsViewer from "./event-args-viewer";

interface EventFeedProps {
  attributionIndex: EventAttributionIndex;
  events: IndexedEvent[];
}

const PAGE_SIZE = 25;

function formatTimestamp(unixTimestamp: string) {
  const timestamp = Number(unixTimestamp);

  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return "Unknown";
  }

  return new Date(timestamp * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const EventFeed = ({ attributionIndex, events }: EventFeedProps) => {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleEvents = events.slice(0, visibleCount);

  if (events.length === 0) {
    return (
      <Text color="fg.muted" textAlign="center" py="12">
        No events match the current filters.
      </Text>
    );
  }

  return (
    <Stack gap="3">
      {visibleEvents.map((event) => {
        const attribution = attributionIndex[event.signature];

        return (
          <Box
            key={event.id}
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="lg"
            bg="bg.panel"
          >
            <Collapsible.Root unmountOnExit>
              <Collapsible.Trigger
                width="full"
                px="4"
                py="4"
                display="flex"
                justifyContent="space-between"
                alignItems="start"
                gap="3"
              >
                <Stack gap="2" align="start" flex="1" minW="0">
                  <HStack gap="2" flexWrap="wrap">
                    <Code fontSize="sm" fontWeight="medium">
                      {event.eventName}
                    </Code>
                    {attribution?.category ? (
                      <Badge
                        colorPalette={attribution.colorPalette}
                        variant="subtle"
                        fontSize="xs"
                      >
                        {attribution.category}
                      </Badge>
                    ) : null}
                  </HStack>

                  <HStack gap="3" flexWrap="wrap">
                    <Text color="fg.muted" fontSize="xs">
                      Block {event.blockNumber}
                    </Text>
                    <Text color="fg.muted" fontSize="xs">
                      {formatTimestamp(event.blockTimestamp)}
                    </Text>
                    <Text color="fg.muted" fontSize="xs">
                      Tx {truncateAddress(event.transactionHash)}
                    </Text>
                  </HStack>

                  {attribution?.displayNames.length ? (
                    <Wrap gap="2">
                      {attribution.displayNames.map((displayName) => (
                        <Badge
                          key={`${event.id}-${displayName}`}
                          colorPalette={attribution.colorPalette}
                          variant="outline"
                          fontSize="xs"
                        >
                          {displayName}
                        </Badge>
                      ))}
                    </Wrap>
                  ) : null}
                </Stack>

                <Collapsible.Indicator
                  transition="transform 0.2s ease"
                  _open={{ transform: "rotate(180deg)" }}
                >
                  <LuChevronDown />
                </Collapsible.Indicator>
              </Collapsible.Trigger>

              <Collapsible.Content>
                <Separator />
                <Stack px="4" py="4" gap="4">
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb="2">
                      Signature
                    </Text>
                    <Code fontSize="xs" wordBreak="break-all">
                      {event.signature}
                    </Code>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb="2">
                      Transaction
                    </Text>
                    <Link
                      href={`https://etherscan.io/tx/${event.transactionHash}`}
                      target="_blank"
                      rel="noreferrer"
                      display="inline-flex"
                      alignItems="center"
                      gap="1"
                      fontSize="sm"
                      color="fg.muted"
                      _hover={{ color: "fg" }}
                    >
                      {event.transactionHash}
                      <LuExternalLink />
                    </Link>
                  </Box>

                  {attribution?.moduleLinks.length ? (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb="2">
                        Architecture modules
                      </Text>
                      <Wrap gap="2">
                        {attribution.moduleLinks.map((moduleLink) => (
                          <Link
                            key={`${event.id}-${moduleLink.facetName}`}
                            as={NextLink}
                            href={moduleLink.href}
                            _hover={{ textDecoration: "none" }}
                          >
                            <Badge
                              colorPalette={moduleLink.colorPalette}
                              variant="outline"
                            >
                              {moduleLink.displayName}
                            </Badge>
                          </Link>
                        ))}
                      </Wrap>
                    </Box>
                  ) : null}

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb="2">
                      Event arguments
                    </Text>
                    <EventArgsViewer args={event.args} />
                  </Box>

                  {attribution?.sourceFiles.length ? (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb="2">
                        Source Explorer
                      </Text>
                      <Wrap gap="2">
                        {attribution.sourceFiles.map((sourceFile) => (
                          <Link
                            key={`${event.id}-${sourceFile.path}`}
                            as={NextLink}
                            href={sourceFile.href}
                            _hover={{ textDecoration: "none" }}
                          >
                            <Badge colorPalette="gray" variant="subtle">
                              {sourceFile.name}
                            </Badge>
                          </Link>
                        ))}
                      </Wrap>
                    </Box>
                  ) : null}
                </Stack>
              </Collapsible.Content>
            </Collapsible.Root>
          </Box>
        );
      })}

      {visibleCount < events.length ? (
        <Box textAlign="center" py="4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          >
            Load more ({events.length - visibleCount} remaining)
          </Button>
        </Box>
      ) : null}
    </Stack>
  );
};

export default EventFeed;
