import { parseImageSyncLimit, syncItpImages } from "@/lib/itp/images";
import { notifyRevalidate } from "./notify-revalidate";

const limit = parseImageSyncLimit(process.env.ITP_IMAGE_SYNC_LIMIT ?? process.argv[2]);

syncItpImages(limit)
  .then(async (result) => {
    console.log("images sync complete", result);
    await notifyRevalidate();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
