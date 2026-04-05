"use client";

import { Stack, Tabs, Text } from "@chakra-ui/react";
import { useState } from "react";
import type { LineRange, SourceFileRecord } from "@/lib/contracts";
import CodeViewer from "@/components/source-explorer/code-viewer";

interface SourceViewerProps {
  files: SourceFileRecord[];
  highlightRange?: LineRange | null;
  initialFilePath?: string;
}

const SourceViewer = ({
  files,
  highlightRange,
  initialFilePath,
}: SourceViewerProps) => {
  const [selectedPath, setSelectedPath] = useState(
    initialFilePath ?? files[0]?.path ?? "",
  );
  const selectedFile =
    files.find((file) => file.path === selectedPath) ?? files[0] ?? null;

  if (!selectedFile) {
    return (
      <Text color="fg.muted">
        Source code is unavailable for this module right now.
      </Text>
    );
  }

  return (
    <Stack gap="4">
      <Text color="fg.muted" fontSize="sm">
        Verified Solidity files related to this module, with line-numbered code
        and direct deep links into the Source Explorer.
      </Text>
      <Tabs.Root
        lazyMount
        value={selectedFile.path}
        variant="line"
        onValueChange={(details) => setSelectedPath(details.value)}
      >
        <Tabs.List overflowX="auto" overflowY="hidden">
          {files.map((file) => (
            <Tabs.Trigger key={file.path} value={file.path}>
              {file.name}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {files.map((file) => (
          <Tabs.Content key={file.path} value={file.path} pt="4">
            <CodeViewer
              file={file}
              highlightRange={
                file.path === selectedFile.path ? highlightRange : null
              }
              maxH="24rem"
              showHeaderLink
            />
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </Stack>
  );
};

export default SourceViewer;
