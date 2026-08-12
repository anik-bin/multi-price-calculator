"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
    { href: "/documents", label: "Documents" },
    { href: "/reports", label: "Reports" },
];

export function DashboardNav({ email }: { email: string }) {
    const pathname = usePathname();
    const router = useRouter();

    async function handleLogout() {
        await api.post("/api/auth/logout");
        router.push("/login");
        router.refresh();
    }

    return (
        <header className="border-b">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
                <nav className="flex items-center gap-4">
                    <span className="font-heading text-sm font-semibold">Pricing Calculator</span>
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "text-sm text-muted-foreground hover:text-foreground",
                                pathname.startsWith(link.href) && "font-medium text-foreground"
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{email}</span>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                        Log out
                    </Button>
                </div>
            </div>
        </header>
    );
}
