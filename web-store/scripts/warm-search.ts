import { searchSeedQueries } from "../src/lib/search-vocabulary";
import { warmSearchQueries } from "../src/lib/search-warmup";

async function main() {
  await warmSearchQueries({
    baseUrl: process.env.WARM_CACHE_BASE ?? "https://climat-simf.ru",
    queries: searchSeedQueries,
  });
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
