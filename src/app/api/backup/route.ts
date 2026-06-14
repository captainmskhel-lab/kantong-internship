import { withAdmin } from "@/lib/api";
import { buildBackup } from "@/lib/repo";
import { NextResponse } from "next/server";
import { todayJakartaISO } from "@/lib/dates";

export const runtime = "nodejs";

export const GET = withAdmin(async () => {
  const backup = await buildBackup();
  const filename = `kantong-internship-backup-${todayJakartaISO()}.json`;
  return new NextResponse(JSON.stringify(backup, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
