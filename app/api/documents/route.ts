import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth/session";
import { createDocumentSchema } from "@/lib/validation/document.schema";
import { errorResponse, validationErrorResponse } from "@/lib/errors";

export async function GET(req: NextRequest) {
    const session = getSessionFromRequest(req);
    if (!session) {
        return errorResponse(401, "Authentication required");
    }

    const documents = await db.document.findMany({
        where: { userId: session.userId },
        orderBy: { issueDate: "desc" },
    });

    return NextResponse.json({ documents });
}

export async function POST(req: NextRequest) {
    const session = getSessionFromRequest(req);
    if (!session) {
        return errorResponse(401, "Authentication required");
    }

    const body = await req.json().catch(() => null);
    const parsed = createDocumentSchema.safeParse(body);

    if (!parsed.success) {
        return validationErrorResponse(parsed.error);
    }

    const document = await db.document.create({
        data: {
            ...parsed.data,
            userId: session.userId,
        },
    });

    return NextResponse.json({ document }, { status: 201 });
}
