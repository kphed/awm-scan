import { ABI_ARTIFACTS } from "./artifacts";
import type { RawAbiEntry, RawAbiParameter } from "./types";

function isEventEntry(entry: RawAbiEntry): entry is RawAbiEntry & {
  type: "event";
  name: string;
  inputs: RawAbiParameter[];
} {
  return (
    entry.type === "event" && Boolean(entry.name) && Array.isArray(entry.inputs)
  );
}

function formatAbiParameterType(parameter: RawAbiParameter): string {
  if (!parameter.type.startsWith("tuple")) {
    return parameter.type;
  }

  const components = (parameter.components ?? [])
    .map((component) => formatAbiParameterType(component))
    .join(",");
  const suffix = parameter.type.slice("tuple".length);

  return `(${components})${suffix}`;
}

export function getEventSignature(entry: RawAbiEntry): string {
  const inputs = (entry.inputs ?? []).map((parameter) =>
    formatAbiParameterType(parameter),
  );

  return `${entry.name ?? ""}(${inputs.join(",")})`;
}

export function getMergedEventAbi(): RawAbiEntry[] {
  const merged = new Map<string, RawAbiEntry>();

  for (const abi of Object.values(ABI_ARTIFACTS)) {
    for (const entry of abi) {
      if (!isEventEntry(entry)) {
        continue;
      }

      const signature = getEventSignature(entry);

      if (!merged.has(signature)) {
        merged.set(signature, entry);
      }
    }
  }

  return [...merged.values()];
}

export function buildEventNameSignatureMap(entries: RawAbiEntry[]) {
  const lookup = new Map<string, string>();

  for (const entry of entries) {
    if (!isEventEntry(entry) || !entry.name) {
      continue;
    }

    const signature = getEventSignature(entry);
    const existing = lookup.get(entry.name);

    // The event snapshot and Explorer filters key on event names, so name
    // overloads must fail loudly instead of producing ambiguous links.
    if (existing && existing !== signature) {
      throw new Error(`Event name overload detected for ${entry.name}`);
    }

    lookup.set(entry.name, signature);
  }

  return lookup;
}

export function getEventNameSignatureMap() {
  return buildEventNameSignatureMap(getMergedEventAbi());
}

export function getEventFacetMap(): Map<string, string[]> {
  const signatureToFacets = new Map<string, string[]>();

  for (const [facetName, abi] of Object.entries(ABI_ARTIFACTS)) {
    for (const entry of abi) {
      if (!isEventEntry(entry)) {
        continue;
      }

      const signature = getEventSignature(entry);
      const facets = signatureToFacets.get(signature) ?? [];

      if (!facets.includes(facetName)) {
        facets.push(facetName);
      }

      signatureToFacets.set(signature, facets);
    }
  }

  return signatureToFacets;
}
