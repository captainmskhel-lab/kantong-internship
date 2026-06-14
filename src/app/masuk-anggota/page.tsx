"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { Aurora } from "@/components/brand/aurora";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/ui/pin-input";
import { FadeUp } from "@/components/ui/motion";
import { apiFetch } from "@/lib/client";

export default function MemberLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(value: string) {
    if (value.length !== 6 || loading) return;
    setError(null);
    setLoading(true);
    const res = await apiFetch("/api/viewer/login", {
      method: "POST",
      body: JSON.stringify({ pin: value }),
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "PIN belum cocok. Coba periksa lagi.");
      return;
    }
    router.replace("/lihat");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-white px-5 py-10">
      <Aurora />
      <div className="relative w-full max-w-md">
        <FadeUp>
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </FadeUp>

        <FadeUp delay={0.05}>
          <div className="card p-6 text-center sm:p-8">
            <div className="mb-6 flex flex-col items-center">
              <LogoMark size={52} />
              <h1 className="mt-4 font-heading text-2xl font-extrabold tracking-tight">Masukkan PIN anggota</h1>
              <p className="mt-1 text-sm text-ink-muted">Gunakan PIN yang dibagikan di grup internship.</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(pin);
              }}
              className="space-y-5"
            >
              <PinInput
                onChange={setPin}
                onComplete={submit}
                disabled={loading}
                error={Boolean(error)}
              />

              {error && (
                <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
                  {error}
                </div>
              )}

              <Button type="submit" fullWidth size="lg" loading={loading} disabled={pin.length !== 6}>
                <Eye className="h-4 w-4" /> Lihat Kantong Internship
              </Button>
            </form>
          </div>
        </FadeUp>

        <FadeUp delay={0.12}>
          <p className="mt-5 text-center text-sm text-ink-muted">
            Kamu bendahara?{" "}
            <Link href="/masuk-bendahara" className="font-semibold text-brand-600 hover:underline">
              Masuk sebagai bendahara
            </Link>
          </p>
        </FadeUp>
      </div>
    </main>
  );
}
