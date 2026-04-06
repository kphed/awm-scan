import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const DEFAULT_SOURCE_PATH = path.resolve(
  import.meta.dir,
  "../src/contracts/events/snapshot.json",
);
const DEFAULT_TARGET_PATH = path.resolve(
  import.meta.dir,
  "../public/events/snapshot.json",
);

export function copyEventSnapshot({
  sourcePath = DEFAULT_SOURCE_PATH,
  targetPath = DEFAULT_TARGET_PATH,
}: {
  sourcePath?: string;
  targetPath?: string;
} = {}) {
  if (!existsSync(sourcePath)) {
    throw new Error(`Missing snapshot source file: ${sourcePath}`);
  }

  mkdirSync(path.dirname(targetPath), { recursive: true });
  copyFileSync(sourcePath, targetPath);

  console.info("[copyEventSnapshot] Copied snapshot", {
    sourcePath,
    targetPath,
  });
}

if (import.meta.main) {
  copyEventSnapshot();
}
