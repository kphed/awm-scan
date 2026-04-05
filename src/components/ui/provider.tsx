"use client";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode";

export function Provider(props: ColorModeProviderProps) {
  const { children, ...colorModeProps } = props;

  return (
    // Keep the next-themes bootstrap script outside Chakra's Emotion output so
    // the server and client hydrate the provider tree in the same order.
    <ColorModeProvider {...colorModeProps}>
      <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>
    </ColorModeProvider>
  );
}
