import { syncItpProducts } from "@/lib/itp/products";
import { notifyRevalidate } from "./notify-revalidate";

syncItpProducts()
  .then(async (result) => {
    console.log("products sync complete", result);
    await notifyRevalidate();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
