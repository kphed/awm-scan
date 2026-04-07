import { Center, Container, Spinner } from "@chakra-ui/react";
import { Suspense } from "react";
import eventSnapshot from "@/contracts/events/snapshot.json";
import ArchitectureMap from "@/components/architecture/architecture-map";
import { countEventOccurrences, getArchitectureData } from "@/lib/contracts";

const ArchitecturePage = () => {
  const data = getArchitectureData();
  const eventOccurrenceCounts = countEventOccurrences(eventSnapshot.events);

  return (
    <Container maxW="8xl" py={{ base: "6", md: "8" }}>
      <Suspense
        fallback={
          <Center minH="24rem">
            <Spinner size="lg" />
          </Center>
        }
      >
        <ArchitectureMap
          data={data}
          eventOccurrenceCounts={eventOccurrenceCounts}
        />
      </Suspense>
    </Container>
  );
};

export default ArchitecturePage;
