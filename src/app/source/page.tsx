import SourceExplorer from "@/components/source-explorer/source-explorer";
import {
  buildSourceOwnerMap,
  getArchitectureData,
  getSourceExplorerData,
} from "@/lib/contracts";

const SourceExplorerLandingPage = () => {
  const architectureData = getArchitectureData();
  const explorerData = getSourceExplorerData();

  return (
    <SourceExplorer
      fileTree={explorerData.fileTree}
      importGraph={explorerData.importGraph}
      sourceFiles={explorerData.sourceFiles}
      sourceOwners={Object.fromEntries(buildSourceOwnerMap(architectureData))}
    />
  );
};

export default SourceExplorerLandingPage;
