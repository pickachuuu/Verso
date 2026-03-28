import { createClient } from "@/utils/supabase/server";
import DashboardClientLayout from "./DashboardClientLayout";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <DashboardClientLayout isAuthenticated={!!user}>
      {children}
    </DashboardClientLayout>
  );
}
