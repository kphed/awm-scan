import { SOURCE_ARTIFACTS } from "./artifacts";
import type { ContractSourceArtifact, SourceArtifactPayload } from "./types";

function unwrapSourceCode(sourceCode: string) {
  if (!sourceCode) {
    throw new Error("Missing SourceCode payload");
  }

  // Etherscan's verified standard-json-input payload is wrapped in `{{...}}`,
  // so we normalize it before JSON.parse.
  if (sourceCode.startsWith("{{") && sourceCode.endsWith("}}")) {
    return `{${sourceCode.slice(2, -2)}}`;
  }

  return sourceCode;
}

export function extractPrimarySourceCode(
  sourceArtifact: ContractSourceArtifact,
) {
  const artifactEntry = sourceArtifact["0"];

  if (!artifactEntry?.SourceCode) {
    throw new Error("Source artifact is missing the primary SourceCode field");
  }

  const parsedPayload = JSON.parse(
    unwrapSourceCode(artifactEntry.SourceCode),
  ) as SourceArtifactPayload;
  const sourceEntries = Object.entries(parsedPayload.sources ?? {});

  if (sourceEntries.length === 0) {
    throw new Error("Source artifact did not contain any source entries");
  }

  // ContractFileName is the safest way to identify the primary module because
  // the verified payload can include interfaces and shared libraries too.
  const primaryEntry =
    (artifactEntry.ContractFileName
      ? sourceEntries.find(([path]) => path === artifactEntry.ContractFileName)
      : null) ?? sourceEntries[0];
  const sourceCode = primaryEntry?.[1]?.content;

  if (!sourceCode) {
    throw new Error("Primary source entry is missing its Solidity content");
  }

  return sourceCode;
}

export function getFacetSourceCode(facetName: string) {
  const sourceArtifact = (
    SOURCE_ARTIFACTS as Record<string, ContractSourceArtifact>
  )[facetName];

  if (!sourceArtifact) {
    console.error("[getFacetSourceCode] Missing source artifact", {
      facetName,
    });
    return null;
  }

  try {
    return extractPrimarySourceCode(sourceArtifact);
  } catch (error) {
    console.error("[getFacetSourceCode] Failed to parse source artifact", {
      facetName,
      error,
    });
    return null;
  }
}
