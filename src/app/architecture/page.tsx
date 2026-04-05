import { Container } from "@chakra-ui/react";
import ArchitectureMap from "@/components/architecture/architecture-map";
import { getArchitectureData } from "@/lib/contracts";

const ArchitecturePage = () => {
  const data = getArchitectureData();

  return (
    <Container maxW="8xl" py={{ base: "6", md: "8" }}>
      <ArchitectureMap data={data} />
    </Container>
  );
};

export default ArchitecturePage;
