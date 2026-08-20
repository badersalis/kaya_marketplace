import { env } from "./config/env";
import { createApp } from "./app";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[api] listening on http://localhost:${env.PORT}`);
  console.log(`[api] swagger docs at http://localhost:${env.PORT}/docs`);
});
