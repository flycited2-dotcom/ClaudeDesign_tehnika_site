import { syncItpCategories } from "@/lib/itp/categories";

syncItpCategories()
  .then((result) => {
    console.log("categories sync complete", result);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
