import { IconButton, Popover, Portal } from "@chakra-ui/react";
import { LuBell } from "react-icons/lu";

const NotificationPopover = () => {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <IconButton variant="ghost" rounded="full" colorPalette="gray">
          <LuBell />
        </IconButton>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content maxW="fit-content">
            <Popover.Body>
              <Popover.Title fontWeight="medium">Notifications</Popover.Title>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
};

export default NotificationPopover;
