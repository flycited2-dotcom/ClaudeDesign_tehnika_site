import { syncItpCategories } from "@/lib/itp/categories";
import { notifyRevalidate } from "./notify-revalidate";

syncItpCategories()
  .then(async (result) => {
    console.log("categories sync complete", result);
    await notifyRevalidate();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
