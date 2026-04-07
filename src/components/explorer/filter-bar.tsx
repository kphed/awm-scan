"use client";

import { Button, HStack, Stack, Text, Wrap } from "@chakra-ui/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  EVENT_CATEGORIES,
  type EventCategory,
} from "@/lib/contracts/event-attribution";

const FilterBar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const activeCategory = searchParams.get("category") as EventCategory | null;
  const activeEvent = searchParams.get("event");
  const activeSignature = searchParams.get("signature");
  const activeModule = searchParams.get("module");

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParamsString);

      if (!value || params.get(key) === value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      const nextQuery = params.toString();

      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParamsString],
  );

  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams(searchParamsString);

    params.delete("category");
    params.delete("event");
    params.delete("signature");
    params.delete("module");

    const nextQuery = params.toString();

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParamsString]);

  const clearEventFilter = useCallback(() => {
    const params = new URLSearchParams(searchParamsString);

    params.delete("event");
    params.delete("signature");

    const nextQuery = params.toString();

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParamsString]);

  return (
    <Stack gap="3">
      <Text fontSize="sm" fontWeight="medium" color="fg.muted">
        Filter by category
      </Text>
      <Wrap gap="2">
        {(Object.keys(EVENT_CATEGORIES) as EventCategory[]).map((category) => (
          <Button
            key={category}
            size="xs"
            variant={activeCategory === category ? "solid" : "outline"}
            colorPalette={activeCategory === category ? "blue" : "gray"}
            onClick={() => updateParam("category", category)}
          >
            {category}
          </Button>
        ))}
        {activeCategory || activeEvent || activeSignature || activeModule ? (
          <Button
            size="xs"
            variant="outline"
            colorPalette="red"
            onClick={clearAllFilters}
          >
            Clear all
          </Button>
        ) : null}
      </Wrap>

      {activeEvent ? (
        <HStack gap="2" flexWrap="wrap">
          <Text fontSize="sm" color="fg.muted">
            Event:
          </Text>
          <Button
            size="xs"
            variant="subtle"
            colorPalette="purple"
            onClick={clearEventFilter}
          >
            {activeEvent}
          </Button>
        </HStack>
      ) : null}

      {activeModule ? (
        <HStack gap="2" flexWrap="wrap">
          <Text fontSize="sm" color="fg.muted">
            Module:
          </Text>
          <Button
            size="xs"
            variant="subtle"
            colorPalette="green"
            onClick={() => updateParam("module", null)}
          >
            {activeModule}
          </Button>
        </HStack>
      ) : null}
    </Stack>
  );
};

export default FilterBar;
