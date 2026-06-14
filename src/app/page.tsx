import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Wallet, Eye, ShieldCheck, TrendingUp } from "lucide-react";
import { Aurora } from "@/components/brand/aurora";
import { LogoMark } from "@/components/brand/logo";
import { FadeUp, Stagger, StaggerItem } from "@/components/ui/motion";
import { needsSetup } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // First run: send the treasurer straight to the setup wizard (spec §33).
  if (await needsSetup()) redirect("/setup");

  return (
    <main className="relative min-h-dvh overflow-hidden bg-white">
      <Aurora dense />

      <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-5 py-8 sm:px-8">
        <FadeUp>
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <LogoMark size={36} />
              <span className="font-heading text-base font-extrabold tracking-tight">
                Kantong <span className="text-brand-600">Internship</span>
              </span>
            </div>
            <span className="hidden rounded-full border border-line bg-white/70 px-3 py-1 text-xs font-medium text-ink-muted backdrop-blur sm:block">
              Kas internship • internal
            </span>
          </header>
        </FadeUp>

        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <FadeUp delay={0.05}>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-700">
              <ShieldCheck className="h-3.5 w-3.5" /> Untuk 16 dokter internship
            </span>
          </FadeUp>

          <FadeUp delay={0.1}>
            <h1 className="font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              Kantong <span className="bg-brand-gradient bg-clip-text text-transparent">Internship</span>
            </h1>
          </FadeUp>

          <FadeUp delay={0.16}>
            <p className="mt-4 text-sm font-medium text-ink-muted sm:text-base">
              RSUD Kabanjahe • Puskesmas Tigapanah • Puskesmas Merek
            </p>
          </FadeUp>

          <FadeUp delay={0.22}>
            <p className="mx-auto mt-3 max-w-md text-balance text-[15px] leading-relaxed text-ink-muted sm:text-lg">
              Catat, pantau, dan laporkan kas internship dengan lebih rapi.
            </p>
          </FadeUp>

          <Stagger className="mt-9 grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
            <StaggerItem>
              <Link
                href="/masuk-bendahara"
                className="group relative flex h-full flex-col items-start gap-3 overflow-hidden rounded-3xl bg-brand-gradient p-5 text-left text-white shadow-card transition hover:shadow-card-hover"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
                  <Wallet className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-heading text-lg font-bold">Masuk sebagai Bendahara</span>
                  <span className="mt-0.5 block text-sm text-white/85">Catat pembayaran & kelola kas</span>
                </span>
                <ArrowRight className="absolute right-5 top-5 h-5 w-5 transition group-hover:translate-x-1" />
              </Link>
            </StaggerItem>

            <StaggerItem>
              <Link
                href="/masuk-anggota"
                className="group relative flex h-full flex-col items-start gap-3 overflow-hidden rounded-3xl border border-line bg-white p-5 text-left shadow-card transition hover:border-brand-200 hover:shadow-card-hover"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <Eye className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-heading text-lg font-bold text-ink">Lihat sebagai Anggota</span>
                  <span className="mt-0.5 block text-sm text-ink-muted">Pantau saldo & status iuran</span>
                </span>
                <ArrowRight className="absolute right-5 top-5 h-5 w-5 text-ink-muted transition group-hover:translate-x-1 group-hover:text-brand-600" />
              </Link>
            </StaggerItem>
          </Stagger>

          <FadeUp delay={0.4}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-brand-600" /> Hitung saldo otomatis
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-600" /> Akses aman dengan PIN
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-brand-600" /> Laporan PDF & Excel
              </span>
            </div>
          </FadeUp>
        </div>

        <FadeUp delay={0.5}>
          <footer className="pb-2 pt-6 text-center text-xs text-ink-muted/80">
            Dokumen internal Kantong Internship • Data finansial hanya tampil setelah masuk
          </footer>
        </FadeUp>
      </div>
    </main>
  );
}
