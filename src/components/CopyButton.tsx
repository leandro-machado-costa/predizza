"use client";

import { useState } from "react";
import { SecondaryButton } from "@/components/ui";

export function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <SecondaryButton
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
    >
      {done ? "Copiado" : label}
    </SecondaryButton>
  );
}
