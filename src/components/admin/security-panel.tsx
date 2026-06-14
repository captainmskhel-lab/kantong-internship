"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCog, Lock, KeyRound, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PinInput } from "@/components/ui/pin-input";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/client";

export function SecurityPanel({ username }: { username: string }) {
  return (
    <div className="space-y-4">
      <ChangeUsername username={username} />
      <ChangePassword />
      <ChangePin />
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{icon}</span>
        <div>
          <h3 className="font-heading text-base font-bold">{title}</h3>
          <p className="text-xs text-ink-muted">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function ChangeUsername({ username }: { username: string }) {
  const router = useRouter();
  const toast = useToast();
  const [currentPassword, setCurrent] = useState("");
  const [newUsername, setNewUsername] = useState(username);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await apiFetch<{ message: string }>("/api/security/username", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newUsername: newUsername.trim() }),
    });
    setBusy(false);
    if (!res.ok) return toast.error(res.error ?? "Gagal mengganti username.");
    toast.success(res.data?.message ?? "Username bendahara berhasil diganti.");
    setCurrent("");
    router.refresh();
  }

  return (
    <Section icon={<UserCog className="h-5 w-5" />} title="Ganti username" description="Ubah username login bendahara.">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Username baru">
          <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} autoComplete="username" />
        </Field>
        <Field label="Password saat ini">
          <Input type="password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        </Field>
        <Button type="submit" loading={busy} disabled={!currentPassword || newUsername.trim().length < 3}>
          <Save className="h-4 w-4" /> Simpan username
        </Button>
      </form>
    </Section>
  );
}

function ChangePassword() {
  const toast = useToast();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error("Konfirmasi password tidak sama.");
    setBusy(true);
    const res = await apiFetch<{ message: string }>("/api/security/password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
    setBusy(false);
    if (!res.ok) return toast.error(res.error ?? "Gagal memperbarui password.");
    toast.success(res.data?.message ?? "Password berhasil diperbarui.");
    setCurrent("");
    setNew("");
    setConfirm("");
  }

  return (
    <Section icon={<Lock className="h-5 w-5" />} title="Ganti password" description="Minimal 8 karakter, ada huruf dan angka.">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Password saat ini">
          <Input type="password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Password baru">
            <Input type="password" value={newPassword} onChange={(e) => setNew(e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Ulangi password baru">
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </Field>
        </div>
        <Button type="submit" loading={busy} disabled={!currentPassword || newPassword.length < 8}>
          <Save className="h-4 w-4" /> Simpan password
        </Button>
      </form>
    </Section>
  );
}

function ChangePin() {
  const toast = useToast();
  const [currentPassword, setCurrent] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPin !== confirmPin) return toast.error("Konfirmasi PIN tidak sama.");
    if (!/^\d{6}$/.test(newPin)) return toast.error("PIN harus 6 digit.");
    setBusy(true);
    const res = await apiFetch<{ message: string }>("/api/security/pin", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPin, confirmPin }),
    });
    setBusy(false);
    if (!res.ok) return toast.error(res.error ?? "Gagal mengganti PIN.");
    toast.success(res.data?.message ?? "PIN anggota berhasil diganti.");
    setCurrent("");
    setNewPin("");
    setConfirmPin("");
    setResetKey((k) => k + 1);
  }

  return (
    <Section icon={<KeyRound className="h-5 w-5" />} title="Ganti PIN anggota" description="PIN 6 digit untuk mode anggota.">
      <form onSubmit={submit} className="space-y-4" key={resetKey}>
        <Field label="Password bendahara">
          <Input type="password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        </Field>
        <Field label="PIN baru">
          <PinInput onChange={setNewPin} />
        </Field>
        <Field label="Ulangi PIN baru">
          <PinInput onChange={setConfirmPin} />
        </Field>
        <Button type="submit" loading={busy} disabled={!currentPassword || newPin.length !== 6}>
          <Save className="h-4 w-4" /> Simpan PIN
        </Button>
      </form>
    </Section>
  );
}
