import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const [{ runStockMonitor }, { prisma }] = await Promise.all([
    import("@/lib/stock-monitor-runner"),
    import("@/lib/db"),
  ]);

  try {
    const result = await runStockMonitor({
      testMode: process.argv.includes("--test"),
      dryRun: process.argv.includes("--dry-run"),
    });
    console.log("stock monitor complete", result);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
