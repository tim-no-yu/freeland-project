import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Defaults are fine for this app (SPA-style, no ISR, no R2 cache).
  // If we ever add Next image optimization or ISR, configure it here.
});
