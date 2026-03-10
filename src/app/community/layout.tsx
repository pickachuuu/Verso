import { createClient } from "@/utils/supabase/server";
import CommunityClientLayout from "./CommunityClientLayout";

export default async function CommunityLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <CommunityClientLayout isAuthenticated={!!user}>
            {children}
        </CommunityClientLayout>
    );
}
