import { syncItpPrices } from "@/lib/itp/prices";

syncItpPrices()
  .then((result) => {
    console.log("prices sync complete", result);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
