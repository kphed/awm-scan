import { Box, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { LuChevronRight, LuFileCode2, LuFolderOpen } from "react-icons/lu";
import {
  buildSourceExplorerHref,
  type LineRange,
  type SourceFileEntry,
} from "@/lib/contracts";

interface FileTreeProps {
  currentPath: string;
  entries: SourceFileEntry[];
  lineRange?: LineRange | null;
  level?: number;
}

const FileTree = ({
  currentPath,
  entries,
  lineRange,
  level = 0,
}: FileTreeProps) => {
  return (
    <Stack gap="1">
      {entries.map((entry) =>
        entry.type === "directory" ? (
          <Stack key={entry.path} gap="1">
            <Text
              color="fg.muted"
              fontSize="sm"
              fontWeight="medium"
              pl={`${level * 1.25}rem`}
            >
              <Box as="span" mr="2" verticalAlign="middle">
                <LuFolderOpen />
              </Box>
              {entry.name}
            </Text>
            <FileTree
              currentPath={currentPath}
              entries={entry.children ?? []}
              lineRange={lineRange}
              level={level + 1}
            />
          </Stack>
        ) : (
          <Link
            key={entry.path}
            as={NextLink}
            href={buildSourceExplorerHref(entry.path, lineRange)}
            display="flex"
            alignItems="center"
            gap="2"
            px="2"
            py="1.5"
            pl={`${level * 1.25 + 0.5}rem`}
            borderRadius="lg"
            bg={currentPath === entry.path ? "blue.subtle" : "transparent"}
            color={currentPath === entry.path ? "blue.fg" : "fg"}
            fontSize="sm"
            textDecoration="none"
            _hover={{ bg: "bg.subtle", textDecoration: "none" }}
          >
            <Box as="span" color="fg.muted">
              {currentPath === entry.path ? (
                <LuChevronRight />
              ) : (
                <LuFileCode2 />
              )}
            </Box>
            <Box as="span" flex="1" minW="0" truncate>
              {entry.name}
            </Box>
          </Link>
        ),
      )}
    </Stack>
  );
};

export default FileTree;
