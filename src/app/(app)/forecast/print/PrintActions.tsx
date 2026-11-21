"use client";

import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { PrimaryButton, SecondaryButton } from "@/components/ui";

export function PrintActions({ whatsappText }: { whatsappText: string }) {
  return (
    <>
      <Link href="/forecast" className="text-sm font-semibold text-accent">
        ← Voltar
      </Link>
      <div className="flex flex-wrap gap-2">
        <CopyButton text={whatsappText} label="Copiar WhatsApp" />
        <PrimaryButton type="button" onClick={() => window.print()}>
          Imprimir / PDF
        </PrimaryButton>
        <SecondaryButton type="button" onClick={() => window.history.back()}>
          Fechar
        </SecondaryButton>
      </div>
    </>
  );
}
