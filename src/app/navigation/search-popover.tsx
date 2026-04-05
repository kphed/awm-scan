import { IconButton, type IconButtonProps } from "@chakra-ui/react";
import { LuSearch } from "react-icons/lu";

// TODO: Render a search popover
const SearchPopover = (props: IconButtonProps) => {
  return (
    <IconButton variant="ghost" rounded="full" colorPalette="gray" {...props}>
      <LuSearch />
    </IconButton>
  );
};

export default SearchPopover;
