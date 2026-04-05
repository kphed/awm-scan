import type { ArchitectureData, BusinessCluster } from "./types";

export interface FacetColumn {
  name: string;
  displayName: string;
  cluster: BusinessCluster;
  colorPalette: string;
}

export interface PermissionMatrixData {
  roles: string[];
  facets: FacetColumn[];
  matrix: Map<string, Set<string>>;
  writeMethodsByFacet: Map<string, string[]>;
}

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  TOKENIZATION_AGENT:
    "Operates subscription and redemption workflows, and can queue or cancel certain timelocked actions.",
  TOKEN_ADMIN:
    "Manages token lifecycle, metadata, pause controls, and token-admin timelock actions.",
  ACCOUNT_ADMIN:
    "Controls investor-account restrictions, stop codes, and account-admin timelock actions.",
  DEFAULT_ADMIN_ROLE:
    "Registry shorthand for the current admin role behind grant/revoke operations; source uses getRoleAdmin(role) instead of a fixed LibFactBase constant.",
  OWNER: "Contract owner that controls module upgrades and ownership changes.",
  PUBLIC: "No dedicated role is required to invoke these write operations.",
};

export function derivePermissionMatrix(
  data: ArchitectureData,
): PermissionMatrixData {
  const roleSet = new Set<string>();
  const facets: FacetColumn[] = [];
  const matrix = new Map<string, Set<string>>();
  const writeMethodsByFacet = new Map<string, string[]>();

  for (const cluster of data.clusters) {
    for (const facet of cluster.facets) {
      const writeMethodNames = facet.writeMethods.map((method) => method.name);

      facets.push({
        name: facet.name,
        displayName: facet.displayName,
        cluster: cluster.id,
        colorPalette: facet.colorPalette,
      });
      writeMethodsByFacet.set(facet.name, writeMethodNames);

      // The matrix answers "who can invoke write operations," so read-only
      // facets still render as columns but never light up a permission cell.
      if (writeMethodNames.length === 0) {
        continue;
      }

      if (facet.requiredRoles.length === 0) {
        roleSet.add("PUBLIC");
        matrix.set(
          "PUBLIC",
          new Set([...(matrix.get("PUBLIC") ?? []), facet.name]),
        );
        continue;
      }

      for (const role of facet.requiredRoles) {
        roleSet.add(role);
        matrix.set(role, new Set([...(matrix.get(role) ?? []), facet.name]));
      }
    }
  }

  const roles = Array.from(roleSet).sort((left, right) => {
    if (left === "PUBLIC") {
      return 1;
    }

    if (right === "PUBLIC") {
      return -1;
    }

    return left.localeCompare(right);
  });

  return { roles, facets, matrix, writeMethodsByFacet };
}
