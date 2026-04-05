"use client";

import { Box, Container, HStack } from "@chakra-ui/react";
import MobilePopover from "./mobile-popover";
import NavbarLinks from "./navbar-links";
import UserMenu from "./user-menu";

const Navigation = () => {
  return (
    <Box borderBottomWidth="1px" bg="bg.panel">
      <Container py={{ base: "3.5", md: "4" }}>
        <HStack justify="space-between">
          <HStack gap={{ base: "4", md: "10" }}>
            <MobilePopover>
              <NavbarLinks />
            </MobilePopover>
            <NavbarLinks hideBelow="md" />
          </HStack>
          <HStack gap={{ base: "2", md: "4" }}>
            <HStack gap={{ base: "2", md: "3" }}>
              <UserMenu />
            </HStack>
          </HStack>
        </HStack>
      </Container>
    </Box>
  );
};

export default Navigation;
