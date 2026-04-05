import { Avatar, Menu, Portal } from "@chakra-ui/react";
import { LuCircleHelp, LuLogOut, LuSettings, LuUser } from "react-icons/lu";

const UserMenu = () => {
  return (
    <Menu.Root positioning={{ placement: "bottom" }}>
      <Menu.Trigger rounded="full">
        <Avatar.Root>
          <Avatar.Fallback />
        </Avatar.Root>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item value="profile">
              <LuUser />
              Profile
            </Menu.Item>
            <Menu.Item value="settings">
              <LuSettings />
              Settings
            </Menu.Item>
            <Menu.Item value="help">
              <LuCircleHelp />
              Help & Support
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item value="logout">
              <LuLogOut />
              Logout
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

export default UserMenu;
