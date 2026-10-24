import "dotenv/config";
import { createApp } from "./app";

const port = Number(process.env.PORT ?? 4000);
createApp().listen(port, () => {
  console.log(`API running on http://localhost:${port}/api`);
});