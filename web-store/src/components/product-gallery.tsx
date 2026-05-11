"use client";

import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductImageFallback } from "@/components/product-image-fallback";

export type ProductGalleryImage = {
  id: string;
  src: string;
  alt: string;
};

export function ProductGallery({ images, name }: { images: ProductGalleryImage[]; name: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const activeImage = images[activeIndex] ?? images[0];
  const hasManyImages = images.length > 1;

  function showPrevious() {
    setActiveIndex((current) => (current <= 0 ? images.length - 1 : current - 1));
  }

  function showNext() {
    setActiveIndex((current) => (current >= images.length - 1 ? 0 : current + 1));
  }

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(false);
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, images.length]);

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
          cursor: activeImage ? "zoom-in" : "default",
        }}
        onClick={() => activeImage && setLightbox(true)}
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

        {activeImage && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(11,20,70,0.65)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              pointerEvents: "none",
            }}
          >
            <ZoomIn size={12} aria-hidden /> Открыть
          </span>
        )}

        {hasManyImages ? (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showPrevious();
              }}
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
              onClick={(event) => {
                event.stopPropagation();
                showNext();
              }}
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

      {lightbox && activeImage && (
        <div
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-label={`Фото ${activeIndex + 1} из ${images.length}`}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(11,20,70,0.78)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            cursor: "zoom-out",
          }}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setLightbox(false);
            }}
            aria-label="Закрыть"
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              width: 44,
              height: 44,
              borderRadius: 999,
              background: "rgba(255,255,255,0.18)",
              color: "#fff",
              border: 0,
              cursor: "pointer",
            }}
          >
            <X size={20} aria-hidden />
          </button>

          {hasManyImages && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrevious();
                }}
                aria-label="Предыдущее фото"
                style={{
                  position: "absolute",
                  left: 20,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.18)",
                  color: "#fff",
                  border: 0,
                  cursor: "pointer",
                }}
              >
                <ChevronLeft size={26} aria-hidden />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showNext();
                }}
                aria-label="Следующее фото"
                style={{
                  position: "absolute",
                  right: 20,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.18)",
                  color: "#fff",
                  border: 0,
                  cursor: "pointer",
                }}
              >
                <ChevronRight size={26} aria-hidden />
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeImage.src}
            alt={activeImage.alt}
            onClick={(event) => event.stopPropagation()}
            style={{
              maxWidth: "92vw",
              maxHeight: "88vh",
              objectFit: "contain",
              cursor: "default",
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
            }}
          />

          <div
            style={{
              position: "absolute",
              bottom: 24,
              left: "50%",
              transform: "translateX(-50%)",
              padding: "8px 16px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.18)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {activeIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
