import { prisma } from "@/lib/db";
import { refreshHasRealImage } from "@/lib/product-real-image";

refreshHasRealImage()
  .then((changed) => {
    console.log("hasRealImage backfill complete, rows changed:", changed);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
