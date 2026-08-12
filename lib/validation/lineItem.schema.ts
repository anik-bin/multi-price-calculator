import { z } from "zod";

const description = z.string().trim().min(1, "Description is required").max(300, "Description must be 300 characters or fewer");
const quantity = z.number().int("Quantity must be a whole number").min(1, "Quantity must be at least 1");
const unitPriceCents = z.number().int("Unit price must be an integer number of cents").nonnegative("Unit price must be >= 0");
const taxBps = z
    .number()
    .int("Tax must be an integer number of basis points")
    .min(0, "Tax percent must be between 0 and 100")
    .max(10000, "Tax percent must be between 0 and 100");

// discount is fixed OR percent, never both — a discriminated union on
// discountType means you physically can't submit both at once
const discountFields = z.discriminatedUnion("discountType", [
    z.object({
        discountType: z.literal("NONE"),
        discountValue: z.literal(0).default(0),
    }),
    z.object({
        discountType: z.literal("FIXED"),
        discountValue: z.number().int("Discount amount must be an integer number of cents").nonnegative("Discount amount must be >= 0"),
    }),
    z.object({
        discountType: z.literal("PERCENT"),
        discountValue: z
            .number()
            .int("Discount percent must be an integer number of basis points")
            .min(0, "Discount percent must be between 0 and 100")
            .max(10000, "Discount percent must be between 0 and 100"),
    }),
]);

// if the caller doesn't mention a discount at all, treat it as NONE rather
// than forcing every request to spell it out
function withDefaultDiscount(input: unknown) {
    if (input && typeof input === "object" && !("discountType" in input)) {
        return { ...input, discountType: "NONE", discountValue: 0 };
    }
    return input;
}

export const createLineItemSchema = z.preprocess(
    withDefaultDiscount,
    z.intersection(
        z.object({ description, quantity, unitPriceCents, taxBps: taxBps.default(0) }),
        discountFields
    )
);

// PATCH keeps every field independently optional except discountType/discountValue,
// which are coupled and have to move together — the route merges this onto the
// existing row and lets calculateLineItem() catch anything left inconsistent
export const updateLineItemSchema = z
    .object({
        description: description.optional(),
        quantity: quantity.optional(),
        unitPriceCents: unitPriceCents.optional(),
        discountType: z.enum(["NONE", "FIXED", "PERCENT"]).optional(),
        discountValue: z.number().int("Discount value must be an integer").nonnegative("Discount value must be >= 0").optional(),
        taxBps: taxBps.optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    })
    .refine((data) => (data.discountType === undefined) === (data.discountValue === undefined), {
        message: "discountType and discountValue must be provided together",
        path: ["discountValue"],
    });
