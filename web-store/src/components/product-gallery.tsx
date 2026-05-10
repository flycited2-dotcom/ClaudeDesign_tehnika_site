"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { ProductImageFallback } from "@/components/product-image-fallback";

export type ProductGalleryImage = {
  id: string;
  src: string;
  alt: string;
};

export function ProductGallery({ images, name }: { images: ProductGalleryImage[]; name: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];
  const hasManyImages = images.length > 1;

  function showPrevious() {
    setActiveIndex((current) => (current <= 0 ? images.length - 1 : current - 1));
  }

  function showNext() {
    setActiveIndex((current) => (current >= images.length - 1 ? 0 : current + 1));
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4" role="region" aria-label={`Галерея товара ${name}`}>
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md bg-zinc-100">
        {activeImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={activeImage.src} alt={activeImage.alt} className="h-full w-full object-contain" />
        ) : (
          <ProductImageFallback />
        )}

        {hasManyImages ? (
          <>
            <button
              type="button"
              onClick={showPrevious}
              className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-sm transition hover:bg-white"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={showNext}
              className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-sm transition hover:bg-white"
              aria-label="Следующее фото"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
            <div className="absolute bottom-3 right-3 rounded-full bg-zinc-950/80 px-3 py-1 text-xs font-semibold text-white">
              {activeIndex + 1} / {images.length}
            </div>
          </>
        ) : null}
      </div>

      {hasManyImages ? (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white transition ${
                index === activeIndex ? "border-teal-700 ring-2 ring-teal-100" : "border-zinc-200 hover:border-teal-300"
              }`}
              aria-label={`Показать фото ${index + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.src} alt="" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      ) : null}

      {hasManyImages ? <p className="mt-3 text-sm text-zinc-500">В карточке {images.length} фото товара.</p> : null}
    </div>
  );
}
