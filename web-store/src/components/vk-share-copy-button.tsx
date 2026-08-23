"use client";

import { useState } from "react";

type Props = {
  comment: string;
  shareUrl: string;
};

export function VkShareCopyButton({ comment, shareUrl }: Props) {
  const [error, setError] = useState("");

  async function copyAndOpen() {
    try {
      await navigator.clipboard.writeText(comment);
      window.location.assign(shareUrl);
    } catch {
      setError("Браузер не разрешил копирование. Выделите текст выше и скопируйте вручную.");
    }
  }

  return (
    <div>
      <button className="btn btn-primary" type="button" onClick={copyAndOpen}>
        Скопировать УТП и открыть VK
      </button>
      {error ? <p style={{ color: "#b91c1c", marginTop: 12 }}>{error}</p> : null}
    </div>
  );
}
