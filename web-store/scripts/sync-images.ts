import { parseImageSyncLimit, syncItpImages } from "@/lib/itp/images";

const limit = parseImageSyncLimit(process.env.ITP_IMAGE_SYNC_LIMIT ?? process.argv[2]);

syncItpImages(limit)
  .then((result) => {
    console.log("images sync complete", result);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
