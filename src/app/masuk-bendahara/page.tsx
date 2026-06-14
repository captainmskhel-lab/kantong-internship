"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft, Wallet } from "lucide-react";
import { Aurora } from "@/components/brand/aurora";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FadeUp } from "@/components/ui/motion";
import { apiFetch } from "@/lib/client";

export default function TreasurerLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password, remember }),
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Username atau password belum cocok.");
      return;
    }
    router.replace("/admin");
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
          <div className="card overflow-hidden p-6 sm:p-8">
            <div className="mb-6 flex flex-col items-center text-center">
              <LogoMark size={52} />
              <h1 className="mt-4 font-heading text-2xl font-extrabold tracking-tight">Masuk sebagai Bendahara</h1>
              <p className="mt-1 text-sm text-ink-muted">Gunakan username dan password bendahara.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Username">
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="bendahara"
                  autoComplete="username"
                  autoFocus
                  required
                />
              </Field>

              <Field label="Password">
                <div className="relative">
                  <Input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="tap absolute right-1 top-1/2 -translate-y-1/2 rounded-xl p-2 text-ink-muted transition hover:text-ink"
                    aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </Field>

              <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-ink-muted">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-200"
                />
                Ingat perangkat ini
              </label>

              {error && (
                <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
                  {error}
                </div>
              )}

              <Button type="submit" fullWidth size="lg" loading={loading}>
                <Wallet className="h-4 w-4" /> Masuk sebagai Bendahara
              </Button>
            </form>
          </div>
        </FadeUp>

        <FadeUp delay={0.12}>
          <p className="mt-5 text-center text-sm text-ink-muted">
            Mau melihat saja?{" "}
            <Link href="/masuk-anggota" className="font-semibold text-brand-600 hover:underline">
              Masuk sebagai anggota
            </Link>
          </p>
        </FadeUp>
      </div>
    </main>
  );
}
