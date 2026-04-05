"use client";

import { Box, Container, HStack } from "@chakra-ui/react";
import Logo from "./logo";
import MobilePopover from "./mobile-popover";
import NavbarLinks from "./navbar-links";
import NotificationPopover from "./notification-popover";
import SearchField from "./search-field";
import SearchPopover from "./search-popover";
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
            <Logo />
            <NavbarLinks hideBelow="md" />
          </HStack>
          <HStack gap={{ base: "2", md: "4" }}>
            <SearchField hideBelow="lg" />
            <HStack gap={{ base: "2", md: "3" }}>
              <SearchPopover hideFrom="lg" />
              <NotificationPopover />
              <UserMenu />
            </HStack>
          </HStack>
        </HStack>
      </Container>
    </Box>
  );
};

export default Navigation;
