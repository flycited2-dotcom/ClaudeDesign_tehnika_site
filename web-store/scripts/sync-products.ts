import { syncItpProducts } from "@/lib/itp/products";

syncItpProducts()
  .then((result) => {
    console.log("products sync complete", result);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
