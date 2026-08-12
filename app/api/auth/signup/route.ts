import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/hash";
import { signToken } from "@/lib/auth/jwt";
import { signUpSchema } from "@/lib/validation/auth.schema";
import { COOKIE_NAME } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
    const body = await req.json().catch(()=>null);
    const parsed = signUpSchema.safeParse(body);

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

    const { email, password } = parsed.data;

    const existingUser = await db.user.findUnique({ where: { email } });

    if (existingUser) {
        return NextResponse.json(
            {error: "An account with this email already exists"},
            {status: 409}
        );
    }

    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
        data: {email, passwordHash},
    });

    const token = signToken({userId: user.id, email: user.email});

    const res = NextResponse.json(
        {user: {id: user.id, email: user.email}},
        {status: 201}
    );
    res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60*60*24*7
    });

    return res;
}

