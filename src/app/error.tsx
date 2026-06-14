"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-600">
        <AlertTriangle className="h-8 w-8" />
      </span>
      <h1 className="mt-6 font-heading text-2xl font-extrabold tracking-tight">Ada yang tidak beres</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        Permintaan ke server gagal diproses. Coba lagi sebentar.
      </p>
      <Button className="mt-6" onClick={reset}>
        <RotateCcw className="h-4 w-4" /> Coba lagi
      </Button>
    </main>
  );
}
