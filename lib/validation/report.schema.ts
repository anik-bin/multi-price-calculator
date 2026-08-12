import { z } from "zod";

// kept to plain calendar dates (no time component) on purpose — this report
// is day-granularity, and it lets the route treat "to" as inclusive by just
// stepping to the start of the next day instead of guessing at end-of-day ms
function dateOnlyField(label: string) {
    return z
        .string({ error: `${label} is required` })
        .refine(
            (val) => /^\d{4}-\d{2}-\d{2}$/.test(val) && !Number.isNaN(Date.parse(val)),
            `${label} must be a valid date in YYYY-MM-DD format`
        );
}

export const reportQuerySchema = z
    .object({
        from: dateOnlyField("from"),
        to: dateOnlyField("to"),
    })
    .refine((data) => data.from <= data.to, {
        message: "from must be on or before to",
        path: ["from"],
    });
