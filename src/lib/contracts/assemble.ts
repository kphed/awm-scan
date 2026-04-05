import { FACT_TOKEN_DIAMOND_ADDRESS, SOURCE_ARTIFACTS } from "./artifacts";
import { getAllFacets } from "./abi-parser";
import { BUSINESS_CLUSTERS, FACET_REGISTRY } from "./registry";
import type {
  ArchitectureData,
  ArchitectureFacet,
  ClusterDefinition,
  ClusterGroup,
  FacetData,
  FacetMetadata,
} from "./types";

interface AssembleArchitectureDataOptions {
  allFacets?: FacetData[];
  facetRegistry?: ReadonlyMap<string, FacetMetadata>;
  clusterDefinitions?: ClusterDefinition[];
}

function createFallbackMetadata(name: string): FacetMetadata {
  return {
    name,
    displayName: name.replace(/Facet$/, ""),
    cluster: "protocol-internals",
    businessSummary: "No description available — metadata entry required.",
    operationalImpact: "",
    requiredRoles: [],
  };
}

export function assembleArchitectureData(
  options: AssembleArchitectureDataOptions = {},
): ArchitectureData {
  const allFacets = options.allFacets ?? getAllFacets();
  const facetRegistry = options.facetRegistry ?? FACET_REGISTRY;
  const clusterDefinitions = options.clusterDefinitions ?? BUSINESS_CLUSTERS;
  const facetMap = new Map(allFacets.map((facet) => [facet.name, facet]));
  const sourceArtifacts = SOURCE_ARTIFACTS as Record<
    string,
    { address?: string }
  >;
  const diamondProxy = facetMap.get("FactTokenDiamond");

  if (!diamondProxy) {
    throw new Error(
      "FactTokenDiamond ABI data is required for the architecture page",
    );
  }

  const selectableFacets = allFacets.filter(
    (facet) => facet.name !== "FactTokenDiamond",
  );
  const clusters: ClusterGroup[] = clusterDefinitions.map((cluster) => ({
    id: cluster.id,
    label: cluster.label,
    subtitle: cluster.subtitle,
    colorPalette: cluster.colorPalette,
    facets: cluster.facetNames
      .map((facetName) => {
        const facet = facetMap.get(facetName);
        const metadata = facetRegistry.get(facetName);

        if (!facet || !metadata) {
          console.error(
            "[assembleArchitectureData] Registry cluster references missing facet data",
            { facetName, clusterId: cluster.id },
          );
          return null;
        }

        const merged: ArchitectureFacet = {
          ...facet,
          ...metadata,
          colorPalette: cluster.colorPalette,
          address: sourceArtifacts[facetName]?.address ?? undefined,
          isFallback: false,
        };

        return merged;
      })
      .filter((facet): facet is ArchitectureFacet => facet !== null),
  }));
  const internalsCluster = clusters.find(
    (cluster) => cluster.id === "protocol-internals",
  );

  if (!internalsCluster) {
    throw new Error(
      "Protocol internals cluster is required for fallback facets",
    );
  }

  // Unknown ABI files should still render somewhere predictable instead of
  // disappearing from the map, so they fall back into protocol internals.
  for (const facet of selectableFacets) {
    if (facetRegistry.has(facet.name)) {
      continue;
    }

    console.error(
      "[assembleArchitectureData] No registry entry for facet, using fallback",
      { facetName: facet.name },
    );
    internalsCluster.facets.push({
      ...facet,
      ...createFallbackMetadata(facet.name),
      colorPalette: internalsCluster.colorPalette,
      address: sourceArtifacts[facet.name]?.address ?? undefined,
      isFallback: true,
    });
  }

  return {
    clusters,
    diamondProxy: {
      ...diamondProxy,
      address: FACT_TOKEN_DIAMOND_ADDRESS,
      technicalName: "FactTokenDiamond",
      displayName: "MONY Fund Token",
    },
    stats: {
      totalFacets: selectableFacets.length,
      totalFunctions: selectableFacets.reduce(
        (sum, facet) =>
          sum + facet.readMethods.length + facet.writeMethods.length,
        0,
      ),
      totalEvents: selectableFacets.reduce(
        (sum, facet) => sum + facet.events.length,
        0,
      ),
    },
  };
}

export function getArchitectureData() {
  return assembleArchitectureData();
}
