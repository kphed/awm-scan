import {
  Accordion,
  Badge,
  Box,
  Heading,
  HStack,
  Link,
  Stack,
  Text,
  Wrap,
} from "@chakra-ui/react";
import type { ArchitectureFacet } from "@/lib/contracts";
import { eipToUrl, truncateAddress } from "@/lib/format";
import EventList from "./event-list";
import MethodList from "./method-list";
import ModifierChain from "./modifier-chain";
import SourceViewer from "./source-viewer";

interface FacetSidebarProps {
  eventOccurrenceCounts: Record<string, number>;
  facet: ArchitectureFacet;
}

const FacetSidebar = ({ eventOccurrenceCounts, facet }: FacetSidebarProps) => {
  const sourceFilesByPath = Object.fromEntries(
    facet.relatedSourceFiles.map((file) => [file.path, file]),
  );

  return (
    <Stack gap="6">
      <Stack gap="4">
        <HStack justify="space-between" align="start" gap="4">
          <Stack gap="2">
            <Heading size="lg">{facet.displayName}</Heading>
            {facet.isFallback ? (
              <Badge colorPalette="orange" variant="subtle" width="fit-content">
                Metadata Missing
              </Badge>
            ) : null}
            <Text
              color="fg.muted"
              fontFamily="var(--font-geist-mono)"
              fontSize="sm"
            >
              {facet.name}
            </Text>
            {facet.address ? (
              <Link
                href={`https://etherscan.io/address/${facet.address}`}
                target="_blank"
                rel="noreferrer"
                color="fg.muted"
                fontFamily="var(--font-geist-mono)"
                fontSize="sm"
                textDecoration="underline"
                textUnderlineOffset="0.2em"
                width="fit-content"
              >
                {truncateAddress(facet.address)}
              </Link>
            ) : null}
          </Stack>
        </HStack>

        <Stack gap="3">
          <Box>
            <Text fontWeight="medium" mb="1">
              Business Summary
            </Text>
            <Text color="fg.muted">{facet.businessSummary}</Text>
          </Box>
          <Box>
            <Text fontWeight="medium" mb="1">
              Operational Impact
            </Text>
            <Text color="fg.muted">
              {facet.operationalImpact ||
                "No operational notes are available yet."}
            </Text>
          </Box>
          <Box>
            <Text fontWeight="medium" mb="2">
              Required Roles
            </Text>
            {facet.requiredRoles.length === 0 ? (
              <Text color="fg.muted">
                No dedicated role requirement listed.
              </Text>
            ) : (
              <Wrap gap="2">
                {facet.requiredRoles.map((role) => (
                  <Badge
                    key={role}
                    colorPalette={facet.colorPalette}
                    variant="surface"
                  >
                    {role}
                  </Badge>
                ))}
              </Wrap>
            )}
            {facet.requiredRolesNote ? (
              <Text color="fg.muted" fontSize="sm" mt="2">
                {facet.requiredRolesNote}
              </Text>
            ) : null}
          </Box>
          {facet.eipReference ? (
            <Box>
              <Text fontWeight="medium" mb="2">
                Standards
              </Text>
              {(() => {
                const eipUrl = eipToUrl(facet.eipReference);

                return eipUrl ? (
                  <Link href={eipUrl} target="_blank" rel="noreferrer">
                    <Badge
                      colorPalette="blue"
                      variant="subtle"
                      cursor="pointer"
                    >
                      {facet.eipReference}
                    </Badge>
                  </Link>
                ) : (
                  <Badge colorPalette="blue" variant="subtle">
                    {facet.eipReference}
                  </Badge>
                );
              })()}
            </Box>
          ) : null}
        </Stack>
      </Stack>

      <Accordion.Root collapsible multiple variant="plain">
        <Accordion.Item value="read-operations">
          <Accordion.ItemTrigger>
            <Box flex="1" textAlign="start" fontWeight="medium">
              Read Operations
            </Box>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody>
              <MethodList
                methods={facet.readMethods}
                emptyLabel="No read operations defined."
                sourceBySignature={facet.methodSource}
                sourceFilesByPath={sourceFilesByPath}
              />
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>

        <Accordion.Item value="write-operations">
          <Accordion.ItemTrigger>
            <Box flex="1" textAlign="start" fontWeight="medium">
              Write Operations
            </Box>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody>
              <MethodList
                methods={facet.writeMethods}
                emptyLabel="No write operations defined."
                sourceBySignature={facet.methodSource}
                sourceFilesByPath={sourceFilesByPath}
              />
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>

        <Accordion.Item value="role-enforcement">
          <Accordion.ItemTrigger>
            <Box flex="1" textAlign="start" fontWeight="medium">
              Role Enforcement
            </Box>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody>
              <ModifierChain
                methods={[...facet.writeMethods, ...facet.readMethods]}
                methodSource={facet.methodSource}
              />
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>

        <Accordion.Item value="events">
          <Accordion.ItemTrigger>
            <Box flex="1" textAlign="start" fontWeight="medium">
              Emitted Events
            </Box>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody>
              <EventList
                events={facet.events}
                occurrenceCounts={eventOccurrenceCounts}
              />
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>

        <Accordion.Item value="storage-access">
          <Accordion.ItemTrigger>
            <Box flex="1" textAlign="start" fontWeight="medium">
              Storage Access
            </Box>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody>
              {facet.storageAccess.length === 0 ? (
                <Text color="fg.muted">
                  No library-backed storage access was extracted for this
                  module.
                </Text>
              ) : (
                <Stack gap="3">
                  {facet.storageAccess.map((access) => (
                    <Box
                      key={`${access.libraryName}-${access.structName}`}
                      borderWidth="1px"
                      borderColor="border.subtle"
                      borderRadius="lg"
                      bg="bg.panel"
                      p="4"
                    >
                      <Stack gap="2">
                        <Text fontWeight="medium">{access.libraryName}</Text>
                        <Text
                          color="fg.muted"
                          fontFamily="var(--font-geist-mono)"
                          fontSize="xs"
                        >
                          {access.structName} • {access.filePath}
                        </Text>
                        <Wrap gap="2">
                          {access.fields.map((field) => (
                            <Badge
                              key={`${access.libraryName}-${field.name}`}
                              colorPalette={
                                field.access === "write" ? "orange" : "blue"
                              }
                              variant="subtle"
                            >
                              {field.access}: {field.name}
                            </Badge>
                          ))}
                        </Wrap>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>

        <Accordion.Item value="source-code">
          <Accordion.ItemTrigger>
            <Box flex="1" textAlign="start" fontWeight="medium">
              Source Code
            </Box>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody>
              <SourceViewer
                files={facet.relatedSourceFiles}
                initialFilePath={
                  Object.values(facet.methodSource)[0]?.filePath ??
                  facet.relatedSourceFiles[0]?.path
                }
              />
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      </Accordion.Root>
    </Stack>
  );
};

export default FacetSidebar;
