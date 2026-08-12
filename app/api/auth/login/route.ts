import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/hash";
import { signToken } from "@/lib/auth/jwt";
import { loginSchema } from "@/lib/validation/auth.schema";
import { COOKIE_NAME } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
    const body = await req.json().catch(()=>null);
    const parsed = loginSchema.safeParse(body);

    if(!parsed.success) {
        return NextResponse.json(
            {
                error: "Validation failed",
                details: parsed.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            },
            { status: 400 }
        );
    }

    const {email, password} = parsed.data;

    const user = await db.user.findUnique({where: {email}});

    const invalidCredentials = () => {
        return NextResponse.json({error: "Invalid email or password"}, {status: 401});
    }

    if(!user) {
        return invalidCredentials();
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
        return invalidCredentials();
    }

    const token = signToken({userId: user.id, email: user.email});

    const res = NextResponse.json({user: {id: user.id, email: user.email}});
    res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });

    return res;
}