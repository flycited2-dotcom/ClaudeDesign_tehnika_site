import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  if (process.env.B2B_ASSISTANT_BOT_ENABLED !== "true") {
    throw new Error("B2B_ASSISTANT_BOT_ENABLED=true is required to start the B2B assistant bot.");
  }

  const [{ runB2bAssistantBot }, { prisma }] = await Promise.all([
    import("@/lib/b2b-assistant-bot"),
    import("@/lib/db"),
  ]);
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  console.log("B2B assistant bot started");
  try {
    await runB2bAssistantBot({ signal: controller.signal });
  } finally {
    await prisma.$disconnect();
    console.log("B2B assistant bot stopped");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
