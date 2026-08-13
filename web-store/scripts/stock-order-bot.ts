import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  if (process.env.STOCK_ORDER_BOT_ENABLED !== "true") {
    throw new Error("STOCK_ORDER_BOT_ENABLED=true is required to start the B2B order bot.");
  }

  const [{ runStockOrderBot }, { prisma }] = await Promise.all([
    import("@/lib/stock-order-bot"),
    import("@/lib/db"),
  ]);
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  console.log("stock order bot started");
  try {
    await runStockOrderBot({ signal: controller.signal });
  } finally {
    await prisma.$disconnect();
    console.log("stock order bot stopped");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
