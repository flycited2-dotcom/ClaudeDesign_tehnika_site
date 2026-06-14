"use client";

import { useActionState } from "react";
import { updateProductAction, type AdminActionState } from "@/app/admin/actions";

type Attr = { id: string; label: string; value: string; manual: boolean };

type ProductValues = {
  id: string;
  isVisible: boolean;
  name: string;
  manualPrice: string;
  seoTitle: string;
  seoDescription: string;
  description: string;
};

export function ProductEditForm({
  product,
  manualAttributesText,
  attributes,
}: {
  product: ProductValues;
  manualAttributesText: string;
  attributes: Attr[];
}) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(updateProductAction, {});

  return (
    <form action={action} className="adm-card" style={{ maxWidth: 760, display: "grid", gap: 16 }}>
      <input type="hidden" name="id" value={product.id} />

      <label className="flex items-center gap-2" style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>
        <input type="checkbox" name="isVisible" defaultChecked={product.isVisible} style={{ width: 18, height: 18, accentColor: "var(--accent-2)" }} />
        Показывать на витрине
      </label>

      <label className="adm-field">
        <span className="adm-label">SEO / витринное название</span>
        <input name="name" defaultValue={product.name} />
      </label>
      <label className="adm-field">
        <span className="adm-label">Ручная цена, ₽</span>
        <input name="manualPrice" defaultValue={product.manualPrice} inputMode="decimal" placeholder="напр. 12990" />
      </label>
      <label className="adm-field">
        <span className="adm-label">SEO title</span>
        <input name="seoTitle" defaultValue={product.seoTitle} />
      </label>
      <label className="adm-field">
        <span className="adm-label">SEO description</span>
        <input name="seoDescription" defaultValue={product.seoDescription} />
      </label>
      <label className="adm-field">
        <span className="adm-label">Описание</span>
        <textarea name="description" defaultValue={product.description} rows={7} />
      </label>
      <label className="adm-field">
        <span className="adm-label">Ручные характеристики для фильтров</span>
        <textarea
          name="manualAttributes"
          defaultValue={manualAttributesText}
          rows={8}
          placeholder={["Тип сушки: Тепловой насос", "Загрузка: 9 кг", "No Frost: Да", "Цвет: Белый"].join("\n")}
        />
        <span className="text-xs leading-5" style={{ color: "var(--text-mute)" }}>
          Одна строка — одна характеристика. Можно по-русски: «Тип сушки: Тепловой насос», «No Frost: Да», «Цвет: Белый».
        </span>
      </label>

      {attributes.length ? (
        <div style={{ borderRadius: 12, background: "rgba(255,255,255,0.5)", border: "1px solid var(--glass-stroke)", padding: 16 }}>
          <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
            Текущие характеристики
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {attributes.map((attribute) => (
              <span key={attribute.id} className="adm-badge adm-badge--muted">
                {attribute.label}: {attribute.value}
                {attribute.manual ? " · вручную" : ""}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="adm-btn adm-btn--primary">
          {pending ? "Сохраняем…" : "Сохранить"}
        </button>
        {state.ok ? (
          <span className="adm-feedback adm-feedback--ok" role="status" aria-live="polite">
            Сохранено
          </span>
        ) : null}
        {state.error ? (
          <span className="adm-feedback adm-feedback--err" role="status" aria-live="polite">
            {state.error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
