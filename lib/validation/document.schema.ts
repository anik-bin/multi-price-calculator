import { z } from "zod";

// accepts either a plain date ("2026-08-12") or a full ISO datetime string,
// and normalizes it to a Date for Prisma
const issueDateField = z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), {
        message: "Issue date must be a valid date",
    })
    .transform((val) => new Date(val));

export const createDocumentSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(200, "Title must be 200 characters or fewer"),
    customer: z.string().trim().min(1, "Customer is required").max(200, "Customer must be 200 characters or fewer"),
    issueDate: issueDateField,
});

// metadata-only, draft-only edits — status changes only ever happen through
// the finalize endpoint, so it's deliberately left out here (and .strict()
// makes sending it a validation error instead of a silent no-op)
export const updateDocumentSchema = z
    .object({
        title: z.string().trim().min(1, "Title is required").max(200, "Title must be 200 characters or fewer"),
        customer: z.string().trim().min(1, "Customer is required").max(200, "Customer must be 200 characters or fewer"),
        issueDate: issueDateField,
    })
    .partial()
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field (title, customer, issueDate) must be provided",
    });
