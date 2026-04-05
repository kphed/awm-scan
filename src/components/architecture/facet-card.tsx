import { Box, Text } from "@chakra-ui/react";
import type { ArchitectureFacet } from "@/lib/contracts";

interface FacetCardProps {
  facet: ArchitectureFacet;
  isSelected: boolean;
  onSelect: (facet: ArchitectureFacet) => void;
}

const FacetCard = ({ facet, isSelected, onSelect }: FacetCardProps) => {
  return (
    <Box
      as="button"
      width="full"
      textAlign="left"
      px="4"
      py="4"
      borderWidth="1px"
      borderColor={isSelected ? `${facet.colorPalette}.200` : "border.subtle"}
      borderLeftWidth="4px"
      borderLeftColor={`${facet.colorPalette}.400`}
      borderRadius="lg"
      bg={isSelected ? `${facet.colorPalette}.50` : "bg.panel"}
      shadow={isSelected ? "sm" : "xs"}
      transition="background 0.2s ease, border-color 0.2s ease"
      cursor="pointer"
      _hover={{
        bg: isSelected
          ? `${facet.colorPalette}.50`
          : `${facet.colorPalette}.50`,
        borderColor: `${facet.colorPalette}.200`,
      }}
      onClick={() => onSelect(facet)}
    >
      <Text fontWeight="medium" color="fg">
        {facet.displayName}
      </Text>
    </Box>
  );
};

export default FacetCard;
