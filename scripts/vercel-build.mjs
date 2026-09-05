import { spawnSync } from "node:child_process";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, ".vercel/output");
const functionDir = path.join(outputDir, "functions/api.func");

function run(args) {
  const result = spawnSync("pnpm", args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(["--filter", "@workspace/api-server", "run", "build"]);
run(["--filter", "@workspace/splenex-waitlist", "run", "build"]);

await rm(outputDir, { recursive: true, force: true });
await mkdir(path.join(outputDir, "static"), { recursive: true });
await mkdir(functionDir, { recursive: true });

await cp(
  path.join(root, "artifacts/splenex-waitlist/dist/public"),
  path.join(outputDir, "static"),
  { recursive: true },
);

// Also mirror the static output to a top-level "public" folder. Some Vercel
// project configurations ignore the Build Output API (.vercel/output) and
// fall back to looking for a conventional Output Directory. Without this,
// those deployments fail with STATIC_BUILD_NO_OUT_DIR even though the real
// build succeeded.
await rm(path.join(root, "public"), { recursive: true, force: true });
await cp(
  path.join(root, "artifacts/splenex-waitlist/dist/public"),
  path.join(root, "public"),
  { recursive: true },
);

await cp(
  path.join(root, "artifacts/api-server/dist/vercel.mjs"),
  path.join(functionDir, "index.mjs"),
);

await writeFile(
  path.join(functionDir, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs24.x",
      handler: "index.mjs",
      launcherType: "Nodejs",
    },
    null,
    2,
  ),
);

await writeFile(
  path.join(outputDir, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [
        { src: "/api/(.*)", dest: "/api" },
        { handle: "filesystem" },
        { src: "/(.*)", dest: "/index.html" },
      ],
    },
    null,
    2,
  ),
);

console.log("[vercel] Build output written to .vercel/output");