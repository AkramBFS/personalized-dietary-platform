// @ts-nocheck
import { nextStart } from "npm:next@^16/dist/cli/next-start.js";
globalThis.addEventListener("unhandledrejection", (e) => {
  console.error("[entrypoint] Unhandled rejection:", e.reason);
  if (e.reason?.stack) console.error("[entrypoint] Stack:", e.reason.stack);
});
// Guard: skip for forked workers (child_process.fork sets NODE_CHANNEL_FD).
// Workers use override_main_module to run their target script directly.
if (!Deno.env.get("NODE_CHANNEL_FD")) {
  // Use import.meta.dirname so paths resolve against the VFS in the
  // compiled binary rather than the runtime CWD.
  await nextStart({ hostname: "0.0.0.0" }, import.meta.dirname);
}
