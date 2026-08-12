import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { centsToDollarsInput, dollarsToCents, percentToBps, bpsToPercentInput } from "@/lib/format";
import type { DiscountType, LineItem } from "@/types";

export interface LineItemFormValues {
    description: string;
    quantity: string;
    unitPrice: string;
    discountType: DiscountType;
    discountValue: string;
    taxPercent: string;
}

export const emptyLineItemValues: LineItemFormValues = {
    description: "",
    quantity: "1",
    unitPrice: "",
    discountType: "NONE",
    discountValue: "",
    taxPercent: "",
};

export function lineItemToFormValues(item: LineItem): LineItemFormValues {
    return {
        description: item.description,
        quantity: String(item.quantity),
        unitPrice: centsToDollarsInput(item.unitPriceCents),
        discountType: item.discountType,
        discountValue:
            item.discountType === "NONE"
                ? ""
                : item.discountType === "FIXED"
                  ? centsToDollarsInput(item.discountValue)
                  : bpsToPercentInput(item.discountValue),
        taxPercent: item.taxBps ? bpsToPercentInput(item.taxBps) : "",
    };
}

export function lineItemValuesToPayload(values: LineItemFormValues) {
    const base = {
        description: values.description,
        quantity: Number(values.quantity),
        unitPriceCents: dollarsToCents(values.unitPrice),
        taxBps: values.taxPercent ? percentToBps(values.taxPercent) : 0,
    };

    if (values.discountType === "FIXED") {
        return { ...base, discountType: "FIXED" as const, discountValue: dollarsToCents(values.discountValue) };
    }
    if (values.discountType === "PERCENT") {
        return { ...base, discountType: "PERCENT" as const, discountValue: percentToBps(values.discountValue) };
    }
    return { ...base, discountType: "NONE" as const, discountValue: 0 };
}

// shared by the "add line item" form and the "edit line item" dialog — same
// fields, same conversion rules, so both stay in sync automatically
export function LineItemFormFields({
    idPrefix,
    values,
    onChange,
    errorFor,
}: {
    idPrefix: string;
    values: LineItemFormValues;
    onChange: (values: LineItemFormValues) => void;
    errorFor?: (field: string) => string | undefined;
}) {
    function set<K extends keyof LineItemFormValues>(key: K, value: LineItemFormValues[K]) {
        onChange({ ...values, [key]: value });
    }

    const errorText = (field: string) => errorFor?.(field);

    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor={`${idPrefix}-description`}>Description</Label>
                <Input
                    id={`${idPrefix}-description`}
                    value={values.description}
                    onChange={(e) => set("description", e.target.value)}
                    required
                />
                {errorText("description") && <p className="text-sm text-destructive">{errorText("description")}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${idPrefix}-quantity`}>Quantity</Label>
                <Input
                    id={`${idPrefix}-quantity`}
                    type="number"
                    min="1"
                    step="1"
                    value={values.quantity}
                    onChange={(e) => set("quantity", e.target.value)}
                    required
                />
                {errorText("quantity") && <p className="text-sm text-destructive">{errorText("quantity")}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${idPrefix}-unitPrice`}>Unit price ($)</Label>
                <Input
                    id={`${idPrefix}-unitPrice`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={values.unitPrice}
                    onChange={(e) => set("unitPrice", e.target.value)}
                    required
                />
                {errorText("unitPriceCents") && (
                    <p className="text-sm text-destructive">{errorText("unitPriceCents")}</p>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${idPrefix}-discountType`}>Discount</Label>
                <Select
                    value={values.discountType}
                    onValueChange={(v) =>
                        onChange({ ...values, discountType: v as DiscountType, discountValue: "" })
                    }
                >
                    <SelectTrigger id={`${idPrefix}-discountType`} className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="NONE">None</SelectItem>
                        <SelectItem value="FIXED">Fixed amount</SelectItem>
                        <SelectItem value="PERCENT">Percent</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${idPrefix}-discountValue`}>
                    {values.discountType === "FIXED" ? "Discount ($)" : "Discount (%)"}
                </Label>
                <Input
                    id={`${idPrefix}-discountValue`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={values.discountValue}
                    onChange={(e) => set("discountValue", e.target.value)}
                    disabled={values.discountType === "NONE"}
                />
                {errorText("discountValue") && (
                    <p className="text-sm text-destructive">{errorText("discountValue")}</p>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${idPrefix}-taxPercent`}>Tax (%)</Label>
                <Input
                    id={`${idPrefix}-taxPercent`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={values.taxPercent}
                    onChange={(e) => set("taxPercent", e.target.value)}
                />
                {errorText("taxBps") && <p className="text-sm text-destructive">{errorText("taxBps")}</p>}
            </div>
        </div>
    );
}
