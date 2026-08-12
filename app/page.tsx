import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth/jwt";
import { COOKIE_NAME } from "@/lib/auth/session";

export default async function Home() {
    const token = (await cookies()).get(COOKIE_NAME)?.value;
    const session = token ? verifyToken(token) : null;

    redirect(session ? "/documents" : "/login");
}
