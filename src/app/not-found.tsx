import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 text-center">
      <LogoMark size={56} />
      <h1 className="mt-6 font-heading text-3xl font-extrabold tracking-tight">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        Halaman yang kamu cari mungkin sudah dipindahkan atau tidak ada.
      </p>
      <Link
        href="/"
        className="tap mt-6 inline-flex items-center rounded-2xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-card"
      >
        Kembali ke beranda
      </Link>
    </main>
  );
}
