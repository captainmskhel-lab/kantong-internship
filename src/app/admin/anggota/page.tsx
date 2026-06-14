import { getMembers } from "@/lib/repo";
import { MembersView } from "@/components/admin/members-view";
import { PageTransition } from "@/components/ui/motion";

export const dynamic = "force-dynamic";

export default async function MembersPage({ searchParams }: { searchParams: { member?: string } }) {
  const members = await getMembers();
  const activeCount = members.filter((m) => m.active).length;
  return (
    <PageTransition>
      <div className="space-y-5">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">Anggota</h1>
          <p className="text-sm text-ink-muted">{activeCount} anggota aktif dari {members.length} total.</p>
        </div>
        <MembersView members={members} openMemberId={searchParams.member} />
      </div>
    </PageTransition>
  );
}
