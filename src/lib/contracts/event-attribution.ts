import { BUSINESS_CLUSTERS } from "./registry";
import { getEventFacetMap } from "./events";
import { buildSourceExplorerHref, type LineRange } from "./source-explorer";
import type {
  ArchitectureData,
  ArchitectureFacet,
  BusinessCluster,
  SourceFileRecord,
} from "./types";
import type { IndexedEvent } from "./event-types";

export const EVENT_CATEGORIES = {
  "Token Operations": [
    "Transfer",
    "Approval",
    "Mint",
    "Burn",
    "BurnRequested",
    "BurnApproved",
    "BurnRejected",
  ],
  "Access Control": ["RoleGranted", "RoleRevoked", "RoleAdminChanged"],
  "Account Management": [
    "AccountActivated",
    "AccountActivatedBatch",
    "AccountDeactivated",
    "AccountDeactivatedBatch",
    "Locked",
    "LockedBatch",
    "Unlocked",
    "UnlockedBatch",
    "ForceBurned",
    "ForceBurnedBatch",
    "ForceTransferred",
    "ForceTransferredBatch",
  ],
  Governance: [
    "OwnershipTransferred",
    "OwnershipTransferStarted",
    "Paused",
    "Unpaused",
  ],
  Timelock: [
    "TransactionQueued",
    "TransactionExecuted",
    "TransactionCancelled",
    "TransactionRevoked",
    "TimelockDelaySet",
  ],
  "Diamond Proxy": ["DiamondCut"],
  Metadata: [
    "MetadataUpdated",
    "TokenActivated",
    "TokenDeactivated",
    "StopCodesUpdated",
  ],
  Interfaces: [
    "SupportedInterfaceRegistered",
    "SupportedInterfaceRemoved",
    "SupportedInterfacesRegistered",
    "SupportedInterfacesRemoved",
  ],
} as const;

export type EventCategory = keyof typeof EVENT_CATEGORIES;

export interface EventModuleLink {
  facetName: string;
  displayName: string;
  href: string;
  colorPalette: string;
}

export interface EventSourceLink {
  href: string;
  name: string;
  path: string;
}

export interface EventAttribution {
  facetNames: string[];
  displayNames: string[];
  moduleLinks: EventModuleLink[];
  clusters: BusinessCluster[];
  colorPalette: string;
  category: EventCategory | null;
  sourceFiles: EventSourceLink[];
}

export type EventAttributionIndex = Record<string, EventAttribution>;

function buildEventNameToCategoryMap() {
  const lookup = new Map<string, EventCategory>();

  for (const [category, eventNames] of Object.entries(EVENT_CATEGORIES)) {
    for (const eventName of eventNames) {
      lookup.set(eventName, category as EventCategory);
    }
  }

  return lookup;
}

const EVENT_NAME_TO_CATEGORY = buildEventNameToCategoryMap();

function escapeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findEventLineRange(
  file: SourceFileRecord,
  eventName: string,
): LineRange | null {
  const lines = file.content.split(/\r?\n/u);
  const eventPattern = new RegExp(
    `\\bevent\\s+${escapeForRegex(eventName)}\\b`,
    "u",
  );

  for (let index = 0; index < lines.length; index += 1) {
    if (!eventPattern.test(lines[index] ?? "")) {
      continue;
    }

    let end = index;

    // Event declarations often span multiple lines, so keep scanning until the
    // terminating semicolon to land the source deep-link on the full definition.
    while (end < lines.length - 1 && !(lines[end] ?? "").includes(";")) {
      end += 1;
    }

    return {
      start: index + 1,
      end: end + 1,
    };
  }

  return null;
}

function resolveColorPalette(clusters: BusinessCluster[]) {
  if (clusters.length === 0) {
    return "gray";
  }

  return (
    BUSINESS_CLUSTERS.find((cluster) => cluster.id === clusters[0])
      ?.colorPalette ?? "gray"
  );
}

function collectSourceLinks(facets: ArchitectureFacet[], eventName: string) {
  const links = new Map<string, EventSourceLink>();

  for (const facet of facets) {
    const matchedFiles = facet.relatedSourceFiles
      .map((file) => {
        const range = findEventLineRange(file, eventName);

        if (!range) {
          return null;
        }

        return {
          href: buildSourceExplorerHref(file.path, range),
          name: file.name,
          path: file.path,
        } satisfies EventSourceLink;
      })
      .filter((link): link is EventSourceLink => Boolean(link));
    const fallbackFiles =
      matchedFiles.length > 0
        ? matchedFiles
        : facet.relatedSourceFiles.slice(0, 1).map((file) => ({
            href: buildSourceExplorerHref(file.path),
            name: file.name,
            path: file.path,
          }));

    for (const link of fallbackFiles) {
      if (!links.has(link.path)) {
        links.set(link.path, link);
      }
    }
  }

  return [...links.values()];
}

export function buildEventAttributionIndex(
  data: ArchitectureData,
): EventAttributionIndex {
  const facetLookup = new Map(
    data.clusters.flatMap((cluster) =>
      cluster.facets.map((facet) => [facet.name, facet] as const),
    ),
  );
  const attributions: EventAttributionIndex = {};

  for (const [signature, facetNames] of getEventFacetMap()) {
    const eventName = signature.split("(")[0] ?? signature;
    const matchedFacets = facetNames
      .map((facetName) => facetLookup.get(facetName))
      .filter((facet): facet is ArchitectureFacet => Boolean(facet));
    const moduleLinks = matchedFacets.map((facet) => ({
      facetName: facet.name,
      displayName: facet.displayName,
      href: `/architecture?module=${encodeURIComponent(facet.name)}`,
      colorPalette: facet.colorPalette,
    }));
    const displayNames = [
      ...new Set(moduleLinks.map((link) => link.displayName)),
    ];
    const clusters = [...new Set(matchedFacets.map((facet) => facet.cluster))];

    attributions[signature] = {
      facetNames,
      displayNames,
      moduleLinks,
      clusters,
      colorPalette:
        matchedFacets[0]?.colorPalette ?? resolveColorPalette(clusters),
      category: EVENT_NAME_TO_CATEGORY.get(eventName) ?? null,
      sourceFiles: collectSourceLinks(matchedFacets, eventName),
    };
  }

  return attributions;
}

export function findUncategorizedEventNames(eventNames: readonly string[]) {
  return eventNames.filter(
    (eventName) => !EVENT_NAME_TO_CATEGORY.has(eventName),
  );
}

export function assertEventCategoriesCovered(eventNames: readonly string[]) {
  const uncategorizedEventNames = findUncategorizedEventNames(eventNames);

  if (uncategorizedEventNames.length > 0) {
    throw new Error(
      `Uncategorized events: ${uncategorizedEventNames.join(", ")}`,
    );
  }
}

export function countEventOccurrences(
  events: ReadonlyArray<Pick<IndexedEvent, "signature">>,
) {
  const counts: Record<string, number> = {};

  for (const event of events) {
    counts[event.signature] = (counts[event.signature] ?? 0) + 1;
  }

  return counts;
}
