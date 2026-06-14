"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Users,
  Wallet,
  CalendarClock,
  PiggyBank,
  UserCog,
  KeyRound,
  Lock,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { Aurora } from "@/components/brand/aurora";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { PinInput } from "@/components/ui/pin-input";
import { SEED_MEMBERS } from "@/lib/seed-data";
import { monthLabelID } from "@/lib/dates";
import { rupiah } from "@/lib/money";
import { apiFetch } from "@/lib/client";

interface FormState {
  organizationName: string;
  monthlyDuesAmount: number | null;
  dueDay: number;
  startYear: number;
  startMonth: number;
  openingBalance: number | null;
  openingBalanceDate: string;
  username: string;
  password: string;
  pin: string;
}

const TOTAL_STEPS = 9;

export function SetupWizard({ defaultYear, defaultMonth }: { defaultYear: number; defaultMonth: number }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormState>({
    organizationName: "Kantong Internship",
    monthlyDuesAmount: 100000,
    dueDay: 10,
    startYear: defaultYear,
    startMonth: defaultMonth,
    openingBalance: 0,
    openingBalanceDate: "",
    username: "bendahara",
    password: "",
    pin: "",
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function stepError(): string | null {
    switch (step) {
      case 0:
        return form.organizationName.trim() ? null : "Nama aplikasi belum diisi.";
      case 2:
        return form.monthlyDuesAmount && form.monthlyDuesAmount > 0 ? null : "Iuran bulanan harus lebih dari nol.";
      case 4:
        return form.openingBalance != null ? null : "Isi saldo awal (boleh 0).";
      case 5:
        return form.username.trim().length >= 3 ? null : "Username minimal 3 karakter.";
      case 6:
        if (form.password.length < 8) return "Password minimal 8 karakter.";
        if (!/[a-zA-Z]/.test(form.password) || !/\d/.test(form.password)) return "Password harus ada huruf dan angka.";
        return null;
      case 7:
        return /^\d{6}$/.test(form.pin) ? null : "PIN harus 6 digit angka.";
      default:
        return null;
    }
  }

  function next() {
    const err = stepError();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function finish() {
    if (loading || submitted) return; // prevent double submission
    setLoading(true);
    setError(null);
    const res = await apiFetch("/api/setup", {
      method: "POST",
      body: JSON.stringify({
        organizationName: form.organizationName.trim(),
        monthlyDuesAmount: form.monthlyDuesAmount ?? 0,
        dueDay: form.dueDay,
        startMonth: { year: form.startYear, month: form.startMonth },
        openingBalance: form.openingBalance ?? 0,
        openingBalanceDate: form.openingBalanceDate || null,
        internshipStartDate: `${form.startYear}-${String(form.startMonth).padStart(2, "0")}-01`,
        internshipEndDate: null,
        username: form.username.trim(),
        password: form.password,
        pin: form.pin,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Setup gagal. Coba lagi.");
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      router.replace("/admin");
      router.refresh();
    }, 1600);
  }

  const years = [defaultYear - 1, defaultYear, defaultYear + 1, defaultYear + 2];
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-white px-5 py-8">
      <Aurora />
      <div className="relative w-full max-w-lg">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoMark size={32} />
            <span className="font-heading text-sm font-bold">Penyiapan awal</span>
          </div>
          <span className="text-xs font-semibold text-ink-muted tnum">
            Langkah {Math.min(step + 1, TOTAL_STEPS)} / {TOTAL_STEPS}
            {submitted ? " • selesai" : ""}
          </span>
        </div>

        {/* progress */}
        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-stone-100">
          <motion.div
            className="h-full rounded-full bg-brand-gradient"
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>

        <div className="card min-h-[360px] p-6 sm:p-8">
          {!submitted && (
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 && (
                <StepShell icon={<Sparkles />} title="Selamat datang" subtitle="Konfirmasi nama aplikasi kas internship.">
                  <Field label="Nama aplikasi">
                    <Input value={form.organizationName} onChange={(e) => set("organizationName", e.target.value)} />
                  </Field>
                  <p className="text-sm text-ink-muted">RSUD Kabanjahe • Puskesmas Tigapanah • Puskesmas Merek</p>
                </StepShell>
              )}

              {step === 1 && (
                <StepShell icon={<Users />} title="16 anggota internship" subtitle="Daftar anggota sudah disiapkan. Bisa diubah nanti di menu Anggota.">
                  <div className="grid grid-cols-2 gap-2">
                    {SEED_MEMBERS.map((m, i) => (
                      <div key={m} className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2 text-sm">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-50 text-[11px] font-bold text-brand-600 tnum">
                          {i + 1}
                        </span>
                        <span className="truncate font-medium">{m}</span>
                      </div>
                    ))}
                  </div>
                </StepShell>
              )}

              {step === 2 && (
                <StepShell icon={<Wallet />} title="Iuran bulanan" subtitle="Berapa iuran kas per orang tiap bulan?">
                  <Field label="Iuran per orang / bulan">
                    <MoneyInput value={form.monthlyDuesAmount} onChange={(v) => set("monthlyDuesAmount", v)} autoFocus />
                  </Field>
                  <Field label="Jatuh tempo (tanggal)">
                    <Select value={form.dueDay} onChange={(e) => set("dueDay", Number(e.target.value))}>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          Tanggal {d}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <div className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
                    Target per bulan: <b>{rupiah((form.monthlyDuesAmount ?? 0) * 16)}</b> (16 anggota)
                  </div>
                </StepShell>
              )}

              {step === 3 && (
                <StepShell icon={<CalendarClock />} title="Mulai iuran" subtitle="Bulan apa iuran kas pertama kali ditarik?">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Bulan">
                      <Select value={form.startMonth} onChange={(e) => set("startMonth", Number(e.target.value))}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <option key={m} value={m}>
                            {monthLabelID(form.startYear, m).split(" ")[0]}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Tahun">
                      <Select value={form.startYear} onChange={(e) => set("startYear", Number(e.target.value))}>
                        {years.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <p className="text-sm text-ink-muted">
                    Iuran mulai <b>{monthLabelID(form.startYear, form.startMonth)}</b>.
                  </p>
                </StepShell>
              )}

              {step === 4 && (
                <StepShell icon={<PiggyBank />} title="Saldo awal" subtitle="Saldo kas yang sudah ada saat mulai pakai aplikasi.">
                  <Field label="Saldo awal" hint="Saldo awal bukan pemasukan bulan ini. Isi 0 kalau mulai dari nol.">
                    <MoneyInput value={form.openingBalance} onChange={(v) => set("openingBalance", v)} autoFocus />
                  </Field>
                  <Field label="Tanggal saldo awal (opsional)">
                    <Input type="date" value={form.openingBalanceDate} onChange={(e) => set("openingBalanceDate", e.target.value)} />
                  </Field>
                </StepShell>
              )}

              {step === 5 && (
                <StepShell icon={<UserCog />} title="Username bendahara" subtitle="Username untuk masuk ke mode bendahara.">
                  <Field label="Username">
                    <Input value={form.username} onChange={(e) => set("username", e.target.value)} autoFocus autoComplete="username" />
                  </Field>
                </StepShell>
              )}

              {step === 6 && (
                <StepShell icon={<Lock />} title="Password bendahara" subtitle="Minimal 8 karakter, ada huruf dan angka.">
                  <Field label="Password">
                    <div className="relative">
                      <Input
                        type={showPw ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => set("password", e.target.value)}
                        className="pr-12"
                        autoComplete="new-password"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((s) => !s)}
                        className="tap absolute right-1 top-1/2 -translate-y-1/2 rounded-xl p-2 text-ink-muted"
                        aria-label="Tampilkan password"
                      >
                        {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </Field>
                </StepShell>
              )}

              {step === 7 && (
                <StepShell icon={<KeyRound />} title="PIN anggota" subtitle="6 digit untuk dibagikan ke grup internship.">
                  <PinInput onChange={(v) => set("pin", v)} />
                </StepShell>
              )}

              {step === 8 && (
                <StepShell icon={<Check />} title="Periksa & selesaikan" subtitle="Pastikan data sudah benar sebelum disimpan ke database.">
                  <div className="divide-y divide-line rounded-2xl border border-line">
                    <ReviewRow label="Nama aplikasi" value={form.organizationName} />
                    <ReviewRow label="Iuran per bulan" value={`${rupiah(form.monthlyDuesAmount ?? 0)} • jatuh tempo tgl ${form.dueDay}`} />
                    <ReviewRow label="Mulai iuran" value={monthLabelID(form.startYear, form.startMonth)} />
                    <ReviewRow label="Saldo awal" value={rupiah(form.openingBalance ?? 0)} />
                    <ReviewRow label="Username bendahara" value={form.username} />
                    <ReviewRow label="Password" value={"•".repeat(Math.max(8, form.password.length))} />
                    <ReviewRow label="PIN anggota" value={"••••••"} />
                  </div>
                  <p className="text-xs text-ink-muted">
                    Password dan PIN disimpan dalam bentuk hash (tidak pernah disimpan apa adanya).
                  </p>
                </StepShell>
              )}
            </motion.div>
          </AnimatePresence>
          )}

          {error && !submitted && (
            <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
              {error}
            </div>
          )}

          {!submitted && (
            <div className="mt-7 flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={back} disabled={step === 0 || loading}>
                <ArrowLeft className="h-4 w-4" /> Kembali
              </Button>
              {step < TOTAL_STEPS - 1 ? (
                <Button onClick={next}>
                  Lanjut <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={finish} loading={loading} disabled={loading}>
                  <Check className="h-4 w-4" /> Selesaikan setup
                </Button>
              )}
            </div>
          )}

          {submitted && (
            <div className="flex flex-col items-center py-6 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 16 }}
                className="flex h-20 w-20 items-center justify-center rounded-3xl bg-positive/10 text-positive"
              >
                <Check className="h-10 w-10" />
              </motion.div>
              <h2 className="mt-5 font-heading text-2xl font-extrabold">Siap dipakai!</h2>
              <p className="mt-2 text-sm text-ink-muted">Data tersimpan. Mengarahkan ke dashboard bendahara…</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StepShell({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </span>
        <div>
          <h2 className="font-heading text-xl font-bold leading-tight">{title}</h2>
          <p className="text-sm text-ink-muted">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-4 pt-1">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className="text-right font-semibold text-ink">{value}</span>
    </div>
  );
}
