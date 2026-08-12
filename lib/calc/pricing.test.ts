import {
    calculateLineItem,
    calculateDocumentTotals,
    calculateDocument,
    calculateDiscountAmount,
    calculateTaxAmount,
} from "./pricing";

describe("calculateLineItem — assignment sample table", () => {
    it("Widget A: qty 2, $100.00, 10% discount, 5% tax → line total $189.00", () => {
        const result = calculateLineItem({
            quantity: 2,
            unitPriceCents: 10000,
            discountType: "PERCENT",
            discountValue: 1000, // 10%
            taxBps: 500, // 5%
        });
        expect(result.subtotalCents).toBe(20000);
        expect(result.discountAmountCents).toBe(2000);
        expect(result.afterDiscountCents).toBe(18000);
        expect(result.taxAmountCents).toBe(900);
        expect(result.lineTotalCents).toBe(18900);
    });

    it("Widget B: qty 1, $50.00, no discount, 5% tax → line total $52.50", () => {
        const result = calculateLineItem({
            quantity: 1,
            unitPriceCents: 5000,
            discountType: "NONE",
            discountValue: 0,
            taxBps: 500,
        });
        expect(result.subtotalCents).toBe(5000);
        expect(result.discountAmountCents).toBe(0);
        expect(result.afterDiscountCents).toBe(5000);
        expect(result.taxAmountCents).toBe(250);
        expect(result.lineTotalCents).toBe(5250);
    });

    it("Service fee: qty 1, $200.00, $20 fixed discount, no tax → line total $180.00", () => {
        const result = calculateLineItem({
            quantity: 1,
            unitPriceCents: 20000,
            discountType: "FIXED",
            discountValue: 2000, // $20.00
            taxBps: 0,
        });
        expect(result.subtotalCents).toBe(20000);
        expect(result.discountAmountCents).toBe(2000);
        expect(result.afterDiscountCents).toBe(18000);
        expect(result.taxAmountCents).toBe(0);
        expect(result.lineTotalCents).toBe(18000);
    });

    it("document totals match the full worked example: subtotal 450, discount 40, tax 11.50, grand total 421.50", () => {
        const { totals } = calculateDocument([
            { quantity: 2, unitPriceCents: 10000, discountType: "PERCENT", discountValue: 1000, taxBps: 500 },
            { quantity: 1, unitPriceCents: 5000, discountType: "NONE", discountValue: 0, taxBps: 500 },
            { quantity: 1, unitPriceCents: 20000, discountType: "FIXED", discountValue: 2000, taxBps: 0 },
        ]);
        expect(totals.subtotalCents).toBe(45000);
        expect(totals.totalDiscountCents).toBe(4000);
        expect(totals.totalTaxCents).toBe(1150);
        expect(totals.grandTotalCents).toBe(42150);
    });
});

describe("calculateDiscountAmount — edge cases", () => {
    it("clamps a FIXED discount that exceeds the line subtotal", () => {
        const discount = calculateDiscountAmount(10000, "FIXED", 15000);
        expect(discount).toBe(10000); // clamped, not 15000
    });

    it("returns 0 for NONE regardless of discountValue", () => {
        expect(calculateDiscountAmount(10000, "NONE", 0)).toBe(0);
    });

    it("throws for a PERCENT discount above 100%", () => {
        expect(() => calculateDiscountAmount(10000, "PERCENT", 10001)).toThrow();
    });

    it("throws for a negative FIXED discountValue", () => {
        expect(() => calculateDiscountAmount(10000, "FIXED", -100)).toThrow();
    });
});

describe("calculateTaxAmount — edge cases", () => {
    it("returns 0 tax when taxBps is 0", () => {
        expect(calculateTaxAmount(18000, 0)).toBe(0);
    });

    it("throws for taxBps above 10000 (100%)", () => {
        expect(() => calculateTaxAmount(10000, 10001)).toThrow();
    });
});

describe("calculateLineItem — input validation", () => {
    it("throws for quantity < 1", () => {
        expect(() =>
            calculateLineItem({
                quantity: 0,
                unitPriceCents: 1000,
                discountType: "NONE",
                discountValue: 0,
                taxBps: 0,
            })
        ).toThrow();
    });

    it("throws for negative unitPriceCents", () => {
        expect(() =>
            calculateLineItem({
                quantity: 1,
                unitPriceCents: -100,
                discountType: "NONE",
                discountValue: 0,
                taxBps: 0,
            })
        ).toThrow();
    });
});

describe("calculateDocumentTotals — empty document", () => {
    it("returns all zeros for a document with no lines", () => {
        const totals = calculateDocumentTotals([]);
        expect(totals).toEqual({
            subtotalCents: 0,
            totalDiscountCents: 0,
            totalTaxCents: 0,
            grandTotalCents: 0,
        });
    });
});

describe("calculateDiscountAmount — non-integer rejection", () => {
    it("throws for a non-integer FIXED discountValue", () => {
        expect(() => calculateDiscountAmount(10000, "FIXED", 12.5)).toThrow();
    });

    it("throws for a non-integer PERCENT discountValue", () => {
        expect(() => calculateDiscountAmount(10000, "PERCENT", 12.5)).toThrow();
    });
});

describe("calculateTaxAmount — non-integer rejection", () => {
    it("throws for a non-integer taxBps", () => {
        expect(() => calculateTaxAmount(10000, 12.5)).toThrow();
    });
});