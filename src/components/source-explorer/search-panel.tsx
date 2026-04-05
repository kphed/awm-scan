import { Input, Stack, Text } from "@chakra-ui/react";

interface SearchPanelProps {
  query: string;
  resultCount: number;
  onQueryChange: (value: string) => void;
}

const SearchPanel = ({
  query,
  resultCount,
  onQueryChange,
}: SearchPanelProps) => {
  return (
    <Stack gap="2">
      <Input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search source files"
        size="sm"
      />
      <Text color="fg.muted" fontSize="sm">
        {query
          ? `${resultCount} matching source files`
          : "Filter by file path or Solidity content."}
      </Text>
    </Stack>
  );
};

export default SearchPanel;
