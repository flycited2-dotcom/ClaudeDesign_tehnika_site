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
    <div role="region" aria-label={`Галерея товара ${name}`}>
      <div
        style={{
          position: "relative",
          aspectRatio: "4 / 3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          borderRadius: 18,
          background: "rgba(255,255,255,0.55)",
          border: "1px solid var(--glass-stroke)",
        }}
      >
        {activeImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeImage.src}
            alt={activeImage.alt}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : (
          <ProductImageFallback />
        )}

        {hasManyImages ? (
          <>
            <button
              type="button"
              onClick={showPrevious}
              aria-label="Предыдущее фото"
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                background: "rgba(255,255,255,0.85)",
                border: "1px solid var(--glass-stroke)",
                color: "var(--text)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <ChevronLeft size={20} aria-hidden />
            </button>
            <button
              type="button"
              onClick={showNext}
              aria-label="Следующее фото"
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                background: "rgba(255,255,255,0.85)",
                border: "1px solid var(--glass-stroke)",
                color: "var(--text)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <ChevronRight size={20} aria-hidden />
            </button>
            <div
              style={{
                position: "absolute",
                bottom: 12,
                right: 12,
                padding: "4px 12px",
                borderRadius: 999,
                background: "rgba(16,32,74,0.78)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {activeIndex + 1} / {images.length}
            </div>
          </>
        ) : null}
      </div>

      {hasManyImages ? (
        <div style={{ marginTop: 16, display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Показать фото ${index + 1}`}
              style={{
                flexShrink: 0,
                width: 76,
                height: 76,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderRadius: 14,
                background: "rgba(255,255,255,0.55)",
                border:
                  index === activeIndex
                    ? "2px solid var(--accent)"
                    : "1px solid var(--glass-stroke)",
                boxShadow: index === activeIndex ? "var(--shadow-blue)" : "none",
                transition: "border .2s ease",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.src} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </button>
          ))}
        </div>
      ) : null}

      {hasManyImages ? (
        <p style={{ marginTop: 10, fontSize: 13, color: "var(--text-mute)" }}>
          В карточке {images.length} фото товара.
        </p>
      ) : null}
    </div>
  );
}
