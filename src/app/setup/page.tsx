import { redirect } from "next/navigation";
import { SetupWizard } from "./SetupWizard";
import { isSetupCompleted } from "@/lib/repo";
import { currentYearMonthJakarta } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  // Once setup is complete, this route is disabled (spec §33).
  let done = false;
  try {
    done = await isSetupCompleted();
  } catch {
    done = false; // DB not ready yet → allow setup attempt
  }
  if (done) redirect("/");

  const { year, month } = currentYearMonthJakarta();
  return <SetupWizard defaultYear={year} defaultMonth={month} />;
}
