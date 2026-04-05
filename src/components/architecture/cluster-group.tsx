import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { memo } from "react";
import type {
  ArchitectureFacet,
  ClusterGroup as ClusterGroupData,
} from "@/lib/contracts";
import FacetCard from "./facet-card";

interface ClusterGroupProps {
  cluster: ClusterGroupData;
  selectedFacet: ArchitectureFacet | null;
  onSelect: (facet: ArchitectureFacet) => void;
}

const ClusterGroup = memo(
  ({ cluster, selectedFacet, onSelect }: ClusterGroupProps) => {
    return (
      <Box as="section">
        <Stack gap="4">
          <Stack gap="1">
            <Heading size="md">{cluster.label}</Heading>
            <Text color="fg.muted">{cluster.subtitle}</Text>
          </Stack>
          <Stack gap="3">
            {cluster.facets.map((facet) => (
              <FacetCard
                key={facet.name}
                facet={facet}
                isSelected={selectedFacet?.name === facet.name}
                onSelect={onSelect}
              />
            ))}
          </Stack>
        </Stack>
      </Box>
    );
  },
);

ClusterGroup.displayName = "ClusterGroup";

export default ClusterGroup;
