import { jsonError, jsonOk, withAdmin } from "@/lib/api";
import { memberPatchSchema } from "@/lib/validation";
import { updateMember } from "@/lib/repo";

export const runtime = "nodejs";

export const PATCH = (req: Request, ctx: { params: { id: string } }) =>
  withAdmin(async ({ req: r }) => {
    const body = await r.json().catch(() => null);
    const parsed = memberPatchSchema.safeParse(body);
    if (!parsed.success) return jsonError("Data anggota tidak valid.", 422);
    const member = await updateMember(ctx.params.id, parsed.data);
    if (!member) return jsonError("Anggota tidak ditemukan.", 404);
    return jsonOk({ member, message: "Data anggota diperbarui." });
  })(req);
