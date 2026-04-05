import { useMemo } from "react";
import type {
  ArchitectureData,
  ArchitectureFacet,
  FacetDependency,
} from "@/lib/contracts";

export interface DependencyRelationship extends FacetDependency {
  source: string;
  sourceDisplayName: string;
  targetDisplayName: string;
}

interface DependencyHighlightState {
  selectedFacet: string | null;
  highlighted: Set<string>;
  relationships: DependencyRelationship[];
  blastRadius: {
    affectedFacets: number;
    affectedClusters: number;
  };
  facetLookup: Map<string, ArchitectureFacet>;
}

export function useDependencyHighlight(
  data: ArchitectureData,
  selectedFacetName: string | null,
): DependencyHighlightState {
  const facetLookup = useMemo(() => {
    const map = new Map<string, ArchitectureFacet>();

    for (const cluster of data.clusters) {
      for (const facet of cluster.facets) {
        map.set(facet.name, facet);
      }
    }

    return map;
  }, [data]);

  const adjacency = useMemo(() => {
    const map = new Map<string, DependencyRelationship[]>();

    for (const cluster of data.clusters) {
      for (const facet of cluster.facets) {
        for (const dependency of facet.dependencies ?? []) {
          const targetFacet = facetLookup.get(dependency.target);
          const outbound: DependencyRelationship = {
            ...dependency,
            source: facet.name,
            sourceDisplayName: facet.displayName,
            targetDisplayName: targetFacet?.displayName ?? dependency.target,
          };
          const inbound: DependencyRelationship = {
            ...dependency,
            source: dependency.target,
            sourceDisplayName: targetFacet?.displayName ?? dependency.target,
            target: facet.name,
            targetDisplayName: facet.displayName,
            direction: dependency.direction === "uses" ? "used-by" : "uses",
          };

          map.set(facet.name, [...(map.get(facet.name) ?? []), outbound]);
          map.set(dependency.target, [
            ...(map.get(dependency.target) ?? []),
            inbound,
          ]);
        }
      }
    }

    return map;
  }, [data, facetLookup]);

  const relationships = useMemo(() => {
    if (!selectedFacetName) {
      return [];
    }

    return adjacency.get(selectedFacetName) ?? [];
  }, [adjacency, selectedFacetName]);

  const highlighted = useMemo(() => {
    const nextHighlighted = new Set<string>();

    if (!selectedFacetName) {
      return nextHighlighted;
    }

    nextHighlighted.add(selectedFacetName);

    for (const relationship of relationships) {
      nextHighlighted.add(relationship.target);
    }

    return nextHighlighted;
  }, [relationships, selectedFacetName]);

  const blastRadius = useMemo(() => {
    if (!selectedFacetName) {
      return { affectedFacets: 0, affectedClusters: 0 };
    }

    const affectedClusters = new Set<string>();

    for (const cluster of data.clusters) {
      for (const facet of cluster.facets) {
        if (facet.name === selectedFacetName || !highlighted.has(facet.name)) {
          continue;
        }

        affectedClusters.add(cluster.id);
      }
    }

    return {
      affectedFacets: Math.max(highlighted.size - 1, 0),
      affectedClusters: affectedClusters.size,
    };
  }, [data, highlighted, selectedFacetName]);

  return {
    selectedFacet: selectedFacetName,
    highlighted,
    relationships,
    blastRadius,
    facetLookup,
  };
}
