export type DocumentStatus = "DRAFT" | "FINALIZED";
export type DiscountType = "NONE" | "FIXED" | "PERCENT";

export interface LineItem {
    id: string;
    documentId: string;
    description: string;
    quantity: number;
    unitPriceCents: number;
    discountType: DiscountType;
    discountValue: number;
    taxBps: number;
    subtotalCents: number;
    discountAmountCents: number;
    taxAmountCents: number;
    lineTotalCents: number;
    createdAt: string;
    updatedAt: string;
}

export interface Document {
    id: string;
    userId: string;
    title: string;
    customer: string;
    issueDate: string;
    status: DocumentStatus;
    subtotalCents: number;
    totalDiscountCents: number;
    totalTaxCents: number;
    grandTotalCents: number;
    createdAt: string;
    updatedAt: string;
    lineItems?: LineItem[];
}

export interface ReportSummary {
    from: string;
    to: string;
    documentCount: number;
    grandTotalCents: number;
    totalTaxCents: number;
    totalDiscountCents: number;
}
