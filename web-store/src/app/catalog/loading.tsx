const productPlaceholders = Array.from({ length: 8 }, (_, index) => index);
const sidebarPlaceholders = Array.from({ length: 6 }, (_, index) => index);

export default function CatalogLoading() {
  return (
    <main aria-busy="true" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="animate-pulse">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="h-9 w-56 rounded bg-zinc-200" />
            <div className="mt-3 h-4 w-72 max-w-full rounded bg-zinc-200" />
          </div>
          <div className="h-10 w-full rounded-lg bg-zinc-200 md:w-64" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden space-y-3 lg:block">
            {sidebarPlaceholders.map((item) => (
              <div key={item} className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="h-5 w-32 rounded bg-zinc-200" />
                <div className="mt-4 space-y-2">
                  <div className="h-4 rounded bg-zinc-100" />
                  <div className="h-4 w-10/12 rounded bg-zinc-100" />
                  <div className="h-4 w-8/12 rounded bg-zinc-100" />
                </div>
              </div>
            ))}
          </aside>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {productPlaceholders.map((item) => (
              <div key={item} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="aspect-square rounded-md bg-zinc-100" />
                <div className="mt-4 h-5 rounded bg-zinc-200" />
                <div className="mt-2 h-4 w-9/12 rounded bg-zinc-100" />
                <div className="mt-5 h-9 rounded-lg bg-zinc-200" />
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
