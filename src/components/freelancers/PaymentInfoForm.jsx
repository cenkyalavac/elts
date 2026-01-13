import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

const PaymentInfoSchema = z.object({
    payment_info: z.object({
        payment_terms_type: z.string().optional(),
        payment_terms_date: z.coerce.number().optional(),
        invoicing_threshold: z.coerce.number().optional(),
        bank_account_name: z.string().optional(),
        bank_account_number: z.string().optional(),
        bank_name: z.string().optional(),
        bank_address: z.string().optional(),
        bank_country: z.string().optional(),
        iban: z.string().optional(),
        swift_code: z.string().optional(),
        sort_code: z.string().optional(),
        paypal_id: z.string().optional(),
    }).optional(),
    tax_info: z.object({
        vat_number: z.string().optional(),
        tax_id: z.string().optional(),
    }).optional(),
    currency: z.enum(["USD", "EUR", "GBP", "TRY"]).default("USD"),
});

export default function PaymentInfoForm({ freelancer }) {
    const queryClient = useQueryClient();

    const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm({
        resolver: zodResolver(PaymentInfoSchema),
        defaultValues: {
            payment_info: freelancer?.payment_info || {},
            tax_info: freelancer?.tax_info || {},
            currency: freelancer?.currency || 'USD',
        }
    });

    const updateFreelancerMutation = useMutation({
        mutationFn: (data) => base44.entities.Freelancer.update(freelancer.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myApplication'] });
            toast.success("Payment information updated!");
        },
        onError: (error) => {
            toast.error(`Failed to update: ${error.message}`);
        },
    });

    const onSubmit = (data) => {
        updateFreelancerMutation.mutate(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Bank Account Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="bank_account_name">Account Holder Name</Label>
                            <Input id="bank_account_name" {...register("payment_info.bank_account_name")} />
                        </div>
                        <div>
                            <Label htmlFor="bank_name">Bank Name</Label>
                            <Input id="bank_name" {...register("payment_info.bank_name")} />
                        </div>
                        <div>
                            <Label htmlFor="bank_account_number">Account Number</Label>
                            <Input id="bank_account_number" {...register("payment_info.bank_account_number")} />
                        </div>
                        <div>
                            <Label htmlFor="bank_country">Bank Country</Label>
                            <Input id="bank_country" {...register("payment_info.bank_country")} />
                        </div>
                        <div>
                            <Label htmlFor="bank_address">Bank Address</Label>
                            <Input id="bank_address" {...register("payment_info.bank_address")} />
                        </div>
                        <div>
                            <Label htmlFor="currency">Preferred Currency</Label>
                            <Select defaultValue={watch("currency")} onValueChange={(value) => register("currency").onChange({ target: { value } })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="GBP">GBP</SelectItem>
                                    <SelectItem value="TRY">TRY</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>International Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="iban">IBAN</Label>
                            <Input id="iban" {...register("payment_info.iban")} />
                        </div>
                        <div>
                            <Label htmlFor="swift_code">SWIFT Code</Label>
                            <Input id="swift_code" {...register("payment_info.swift_code")} />
                        </div>
                        <div>
                            <Label htmlFor="sort_code">Sort Code</Label>
                            <Input id="sort_code" {...register("payment_info.sort_code")} />
                        </div>
                        <div>
                            <Label htmlFor="paypal_id">PayPal ID</Label>
                            <Input id="paypal_id" {...register("payment_info.paypal_id")} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Payment Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="payment_terms_type">Payment Terms Type</Label>
                            <Input id="payment_terms_type" {...register("payment_info.payment_terms_type")} placeholder="e.g., Net 30" />
                        </div>
                        <div>
                            <Label htmlFor="payment_terms_date">Payment Terms Days</Label>
                            <Input id="payment_terms_date" type="number" {...register("payment_info.payment_terms_date")} placeholder="e.g., 30" />
                        </div>
                        <div>
                            <Label htmlFor="invoicing_threshold">Invoicing Threshold</Label>
                            <Input id="invoicing_threshold" type="number" {...register("payment_info.invoicing_threshold")} placeholder="Minimum amount to invoice" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Tax Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="vat_number">VAT Number</Label>
                            <Input id="vat_number" {...register("tax_info.vat_number")} />
                        </div>
                        <div>
                            <Label htmlFor="tax_id">Tax ID</Label>
                            <Input id="tax_id" {...register("tax_info.tax_id")} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                    <Save className="w-4 h-4 mr-2" />
                )}
                Save Payment Information
            </Button>
        </form>
    );
}