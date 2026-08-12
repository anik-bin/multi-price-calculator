// Units:
//   - All money values are integer CENTS (e.g. $100.00 = 10000).
//   - All percent values are integer BASIS POINTS (1 bp = 0.01%),
//     e.g. 10% = 1000, 5% = 500.
//
// Rounding policy:
//   - Round to the nearest cent (round-half-up) at each intermediate
//     step: discount amount, then tax amount.
//   - Document-level totals are plain sums of already-rounded per-line
//     values, so they always reconcile exactly.

export type DiscountType = "NONE" | "FIXED" | "PERCENT";

export interface LineItemInput {
    quantity: number; //integer >=1
    unitPriceCents: number; // integer >=0
    discountType: DiscountType;
    discountValue: number; // cents if FIXED, basis points if PERCENT, 0 if NONE
    taxBps: number;
}

export interface LineItemResult {
    subtotalCents: number;
    discountAmountCents: number;
    afterDiscountCents: number;
    taxAmountCents: number;
    lineTotalCents: number;
}

export interface DocumentTotals {
    subtotalCents: number;
    totalDiscountCents: number;
    totalTaxCents: number;
    grandTotalCents: number;
}

// BPS DENOMINATOR, 100 BPS = 1%, 100% = 10000 Basis points
const BPS_DENOMINATOR = 10000

// Function to round half up to the nearest integer cent
function roundCents(value: number): number {
    return Math.round(value)
}

/* function to calculate the discount amount for a single line in cents
   fixed discounts are clamped to the line subtotal (cannot exceed line's subtotal). See README for the policy
*/

export function calculateDiscountAmount(
    subtotalCents: number,
    discountType: DiscountType,
    discountValue: number
): number {
    switch (discountType) {
        case "NONE":
            return 0;
        case "FIXED":
            if (!Number.isInteger(discountValue) || discountValue < 0) {
                throw new Error("discount value must be >= 0 for FIXED discounts")
            }
            return Math.min(discountValue, subtotalCents);
        case "PERCENT":
            if (!Number.isInteger(discountValue) || discountValue < 0 || discountValue > BPS_DENOMINATOR) {
                throw new Error("discount value in terms of basis points must be between 0 to 10000 for PERCENT discounts");
            }
            return roundCents((subtotalCents * discountValue) / BPS_DENOMINATOR);
        default: {
            const _exhaustive: never = discountType;
            throw new Error(`Unknown discount type ${_exhaustive}`);
        }
    }
}

/* function to calculate tax amount on already discounted line amount in cents */

export function calculateTaxAmount(
    afterDiscountCents: number,
    taxBps: number
): number {
    if (!Number.isInteger(taxBps) || taxBps < 0 || taxBps > BPS_DENOMINATOR) {
        throw new Error("Tax BPS must be between 0 and 10000");
    }

    return roundCents((afterDiscountCents * taxBps) / BPS_DENOMINATOR);
}

/* Calculate all derived values for a single line item.
   This will be used by function api routes before persisting a line item
*/

export function calculateLineItem(input: LineItemInput): LineItemResult {
    const { quantity, unitPriceCents, discountType, discountValue, taxBps } = input;

    if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error("Quantity must be an integer and >= 1");
    }

    if (!Number.isInteger(unitPriceCents) || unitPriceCents < 0) {
        throw new Error("Unit Price cents must be an integer and >= 0");
    }

    const subtotalCents = quantity * unitPriceCents;

    const discountAmountCents = calculateDiscountAmount(
        subtotalCents,
        discountType,
        discountValue
    );

    const afterDiscountCents = subtotalCents - discountAmountCents;
    const taxAmountCents = calculateTaxAmount(afterDiscountCents, taxBps);
    const lineTotalCents = afterDiscountCents + taxAmountCents;

    return {
        subtotalCents,
        discountAmountCents,
        afterDiscountCents,
        taxAmountCents,
        lineTotalCents
    };
}

/* Function to find the documents totals from its already calculated line items
*/

export function calculateDocumentTotals(
    lineResults: LineItemResult[]
): DocumentTotals {
    return lineResults.reduce<DocumentTotals>((acc, line) => ({
        subtotalCents: acc.subtotalCents + line.subtotalCents,
        totalDiscountCents: acc.totalDiscountCents + line.discountAmountCents,
        totalTaxCents: acc.totalTaxCents + line.taxAmountCents,
        grandTotalCents: acc.grandTotalCents + line.lineTotalCents
    }),
        { subtotalCents: 0, totalDiscountCents: 0, totalTaxCents: 0, grandTotalCents: 0 }
    );
}

/* 
    Function to calculate the line from each raw line and then calculate the documents total from the lines
*/
export function calculateDocument(lines: LineItemInput[]): {
    lines: LineItemResult[];
    totals: DocumentTotals;
} {
    const lineResults = lines.map(calculateLineItem);
    const totals = calculateDocumentTotals(lineResults);
    return { lines: lineResults, totals };
}