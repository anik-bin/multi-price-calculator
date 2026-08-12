import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { COOKIE_NAME } from "@/lib/auth/session";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const token = (await cookies()).get(COOKIE_NAME)?.value;
    const session = token ? verifyToken(token) : null;

    return (
        <div className="flex min-h-full flex-1 flex-col">
            <DashboardNav email={session?.email ?? ""} />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
        </div>
    );
}
