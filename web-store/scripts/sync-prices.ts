import { syncItpPrices } from "@/lib/itp/prices";
import { notifyRevalidate } from "./notify-revalidate";

syncItpPrices()
  .then(async (result) => {
    console.log("prices sync complete", result);
    await notifyRevalidate();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
