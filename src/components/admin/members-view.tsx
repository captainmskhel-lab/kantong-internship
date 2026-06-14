"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserCog, Wallet, Save } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, Switch } from "@/components/ui/field";
import { Pill } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useAdmin } from "./shell-context";
import { apiFetch } from "@/lib/client";
import type { Member } from "@/lib/types";

export function MembersView({ members, openMemberId }: { members: Member[]; openMemberId?: string }) {
  const router = useRouter();
  const toast = useToast();
  const { openPayment } = useAdmin();
  const [editing, setEditing] = useState<Member | null>(null);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  function open(m: Member) {
    setEditing(m);
    setName(m.full_name);
    setActive(m.active);
    setNote(m.internal_note ?? "");
  }

  // Deep-link from global search: open the matching member's editor.
  useEffect(() => {
    if (!openMemberId) return;
    const m = members.find((x) => x.id === openMemberId);
    if (m) open(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openMemberId, members]);

  async function save() {
    if (!editing) return;
    setBusy(true);
    const res = await apiFetch("/api/members/" + editing.id, {
      method: "PATCH",
      body: JSON.stringify({ full_name: name.trim(), active, internal_note: note.trim() || null }),
    });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error ?? "Gagal menyimpan.");
      return;
    }
    toast.success("Data anggota diperbarui.");
    router.refresh();
    setEditing(null);
  }

  return (
    <>
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.025, 0.3) }}
            className="flex items-center gap-3 rounded-2xl border border-line bg-white px-3.5 py-3 transition-all duration-200 hover:-translate-y-px hover:border-brand-200 hover:shadow-card"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 font-heading text-sm font-bold text-brand-600 tnum">
              {m.order_number}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-ink">{m.full_name}</div>
              {!m.active && <Pill tone="neutral">Nonaktif</Pill>}
            </div>
            <button
              onClick={() => openPayment(m.id)}
              className="tap rounded-xl p-2 text-ink-muted transition hover:bg-brand-50 hover:text-brand-600"
              aria-label={`Catat pembayaran ${m.full_name}`}
            >
              <Wallet className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => open(m)}
              className="tap rounded-xl p-2 text-ink-muted transition hover:bg-stone-100 hover:text-ink"
              aria-label={`Ubah ${m.full_name}`}
            >
              <UserCog className="h-4.5 w-4.5" />
            </button>
          </motion.div>
        ))}
      </div>

      <Sheet open={Boolean(editing)} onClose={() => setEditing(null)} title="Ubah anggota">
        <div className="space-y-4">
          <Field label="Nama lengkap">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Switch checked={active} onChange={setActive} label="Anggota aktif" description="Anggota nonaktif tidak dihitung dalam target iuran." />
          <Field label="Catatan internal" hint="Hanya untuk bendahara, tidak ditampilkan ke anggota.">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[60px]" />
          </Field>
          <Button fullWidth loading={busy} onClick={save}>
            <Save className="h-4 w-4" /> Simpan
          </Button>
        </div>
      </Sheet>
    </>
  );
}
