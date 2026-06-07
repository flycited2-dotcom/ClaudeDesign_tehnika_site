/**
 * Counts the number of active catalog filters in a URLSearchParams instance.
 *
 * Counts each individual selection (e.g. 3 selected brands = 3) rather than
 * filter categories, so the user sees granular feedback on the mobile
 * "Фильтры (N)" badge. Sort is NOT counted — it's a display option, not a
 * filter, and has its own UI control.
 */
export function countActiveFilters(searchParams: URLSearchParams): number {
  let count = 0;

  const query = searchParams.get("q");
  if (query && query.trim()) count++;

  count += searchParams.getAll("brand").length;

  const minPrice = searchParams.get("minPrice");
  if (minPrice && minPrice.trim()) count++;

  const maxPrice = searchParams.get("maxPrice");
  if (maxPrice && maxPrice.trim()) count++;

  if (searchParams.get("available")) count++;
  if (searchParams.get("photo")) count++;

  count += searchParams.getAll("spec").length;
  count += searchParams.getAll("attr").length;
  count += searchParams.getAll("attrMin").length;
  count += searchParams.getAll("attrMax").length;

  return count;
}
