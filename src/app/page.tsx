import ExplorerPage from "@/components/explorer/explorer-page";
import {
  buildEventAttributionIndex,
  getArchitectureData,
} from "@/lib/contracts";

const Home = () => {
  const attributionIndex = buildEventAttributionIndex(getArchitectureData());

  return <ExplorerPage attributionIndex={attributionIndex} />;
};

export default Home;
