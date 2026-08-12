import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth/session";
import { reportQuerySchema } from "@/lib/validation/report.schema";
import { errorResponse, validationErrorResponse } from "@/lib/errors";

export async function GET(req: NextRequest) {
    const session = getSessionFromRequest(req);
    if (!session) {
        return errorResponse(401, "Authentication required");
    }

    const parsed = reportQuerySchema.safeParse({
        from: req.nextUrl.searchParams.get("from"),
        to: req.nextUrl.searchParams.get("to"),
    });
    if (!parsed.success) {
        return validationErrorResponse(parsed.error);
    }

    const { from, to } = parsed.data;
    const rangeStart = new Date(`${from}T00:00:00.000Z`);
    const rangeEndExclusive = new Date(`${to}T00:00:00.000Z`);
    rangeEndExclusive.setUTCDate(rangeEndExclusive.getUTCDate() + 1);

    // finalized only — a draft's totals can still change (or the draft can be
    // deleted outright), so counting it here would let the report shift
    // between two loads with nothing actually having "happened"
    const result = await db.document.aggregate({
        where: {
            userId: session.userId,
            status: "FINALIZED",
            issueDate: { gte: rangeStart, lt: rangeEndExclusive },
        },
        _count: { _all: true },
        _sum: {
            grandTotalCents: true,
            totalTaxCents: true,
            totalDiscountCents: true,
        },
    });

    return NextResponse.json({
        from,
        to,
        documentCount: result._count._all,
        grandTotalCents: result._sum.grandTotalCents ?? 0,
        totalTaxCents: result._sum.totalTaxCents ?? 0,
        totalDiscountCents: result._sum.totalDiscountCents ?? 0,
    });
}
