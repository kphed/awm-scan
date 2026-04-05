import SourceExplorer from "@/components/source-explorer/source-explorer";
import {
  buildSourceOwnerMap,
  getArchitectureData,
  getSourceExplorerData,
  parseLineRangeParam,
} from "@/lib/contracts";

interface SourceFilePageProps {
  params: Promise<{ filePath: string[] }>;
  searchParams: Promise<{ line?: string }>;
}

export function generateStaticParams() {
  const explorerData = getSourceExplorerData();

  return Object.keys(explorerData.sourceFiles).map((filePath) => ({
    filePath: filePath.split("/"),
  }));
}

const SourceFilePage = async ({
  params,
  searchParams,
}: SourceFilePageProps) => {
  const architectureData = getArchitectureData();
  const explorerData = getSourceExplorerData();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <SourceExplorer
      currentPath={resolvedParams.filePath.join("/")}
      fileTree={explorerData.fileTree}
      importGraph={explorerData.importGraph}
      lineRange={parseLineRangeParam(resolvedSearchParams.line)}
      sourceFiles={explorerData.sourceFiles}
      sourceOwners={Object.fromEntries(buildSourceOwnerMap(architectureData))}
    />
  );
};

export default SourceFilePage;
