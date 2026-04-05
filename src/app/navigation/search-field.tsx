import {
  Icon,
  Input,
  InputGroup,
  type InputGroupProps,
} from "@chakra-ui/react";
import { LuSearch } from "react-icons/lu";

const SearchField = (props: Omit<InputGroupProps, "children">) => {
  return (
    <InputGroup
      flex="1"
      maxW="md"
      startElement={
        <Icon size="sm">
          <LuSearch />
        </Icon>
      }
      {...props}
    >
      <Input placeholder="Search" variant="subtle" />
    </InputGroup>
  );
};

export default SearchField;
