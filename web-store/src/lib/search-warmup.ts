type FetchLike = (input: string) => Promise<{ ok: boolean; status: number }>;

type WarmSearchOptions = {
  baseUrl: string;
  queries: readonly string[];
  fetchImpl?: FetchLike;
};

export async function warmSearchQueries({
  baseUrl,
  queries,
  fetchImpl = fetch,
}: WarmSearchOptions): Promise<void> {
  const base = baseUrl.replace(/\/+$/, "");

  for (const query of queries) {
    for (const pathname of ["/search", "/api/search/suggest"]) {
      const url = new URL(pathname, base);
      url.searchParams.set("q", query);
      const response = await fetchImpl(url.toString());
      if (!response.ok) {
        throw new Error("[warm-search] " + response.status + " " + url.toString());
      }
    }
  }
}
