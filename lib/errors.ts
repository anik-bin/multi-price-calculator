import { NextResponse } from "next/server";
import { ZodError } from "zod";

// turns a failed zod parse into the field + message shape the frontend can render directly
export function validationErrorResponse(error: ZodError) {
    return NextResponse.json(
        {
            error: "Validation failed",
            details: error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        },
        { status: 400 }
    );
}

export function errorResponse(status: number, message: string) {
    return NextResponse.json({ error: message }, { status });
}
