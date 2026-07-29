import { fileURLToPath } from "node:url";
import { Dictly } from "../src/index.js";
import { startMockServer } from "./mock-server.mjs";

const outputDir =
  process.env.DICTLY_DEMO_OUTPUT || fileURLToPath(new URL("./locales/", import.meta.url));
const { server, baseUrl } = await startMockServer({ port: 0 });

try {
  const dictly = new Dictly({
    id: "happy-app-lang",
    token: "happy-demo-token",
    baseUrl,
    outputDir,
  });

  const manifest = await dictly.init();
  const result = await dictly.pull();

  console.log(`Initialized ${manifest.name} (${manifest.id})`);
  console.log(`Generated ${result.files.length} locale files in ${result.outputDir}`);

  for (const file of result.files) {
    console.log(`- ${file.locale}: ${file.path} (${file.entryCount} entries)`);
  }
} finally {
  server.close();
}
