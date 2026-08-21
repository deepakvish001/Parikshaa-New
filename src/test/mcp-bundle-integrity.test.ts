import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * `supabase/functions/mcp/index.ts` is a build artifact: the @lovable.dev/mcp-js
 * plugin bundles it from src/lib/mcp/index.ts during `npm run build`, inlining
 * `import.meta.env` as it goes.
 *
 * src/lib/mcp/index.ts derives the OAuth issuer from the project ref:
 *
 *   const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";
 *   ...
 *   issuer: `https://${projectRef}.supabase.co/auth/v1`
 *
 * Build without VITE_SUPABASE_PROJECT_ID set and that fallback is baked into the
 * bundle, so the deployed MCP server validates tokens against
 * https://project-ref-unset.supabase.co — a host that does not exist. The build
 * still succeeds and the rewritten file looks like an ordinary regeneration in
 * the diff, so it is easy to commit without noticing.
 *
 * This guards the artifact rather than the build: whatever regenerates it, the
 * committed copy must carry a real ref.
 */

const BUNDLE = "supabase/functions/mcp/index.ts";
const UNSET_SENTINEL = "project-ref-unset";

function readBundle(): string {
  return readFileSync(resolve(process.cwd(), BUNDLE), "utf8");
}

describe("committed MCP edge function", () => {
  it("does not carry the unset-project-ref fallback", () => {
    expect(
      readBundle().includes(UNSET_SENTINEL),
      `${BUNDLE} contains "${UNSET_SENTINEL}" — it was rebuilt without ` +
        `VITE_SUPABASE_PROJECT_ID set, so the deployed OAuth issuer would point ` +
        `at a nonexistent Supabase host. Set the variable and rebuild, or restore ` +
        `the file with: git checkout -- ${BUNDLE}`,
    ).toBe(false);
  });

  it("pins the OAuth issuer to a concrete project ref", () => {
    const match = readBundle().match(/var projectRef = "([^"]+)"/);
    expect(match, `${BUNDLE} no longer assigns projectRef a string literal`).not.toBeNull();
    // Supabase project refs are 20 lowercase letters.
    expect(match![1]).toMatch(/^[a-z]{20}$/);
  });
});
