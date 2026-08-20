import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // src/integrations/supabase/client.ts calls createClient() at module load,
    // and supabase-js validates the URL there. Without these, any test whose
    // import graph reaches the client dies before its first assertion with
    // "Invalid supabase url" out of validateSupabaseUrl.
    //
    // These are placeholders, not credentials: no test makes a network call,
    // and every suite that touches supabase stubs the client itself.
    env: {
      VITE_SUPABASE_URL: "http://localhost:54321",
      VITE_SUPABASE_PUBLISHABLE_KEY: "test-anon-key",
      VITE_SUPABASE_PROJECT_ID: "test-project",
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
