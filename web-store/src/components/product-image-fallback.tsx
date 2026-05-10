import { ImageOff } from "lucide-react";

export function ProductImageFallback({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[linear-gradient(135deg,#f4f4f5,#e8f3ef,#fff7ed)] px-5 text-center">
      <span className={compact ? "flex size-12 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm" : "flex size-16 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm"}>
        <ImageOff className={compact ? "size-6" : "size-8"} aria-hidden />
      </span>
      <span className={compact ? "mt-3 text-xs font-semibold text-zinc-500" : "mt-4 text-sm font-semibold text-zinc-600"}>
        Фото товара уточняется
      </span>
    </div>
  );
}
