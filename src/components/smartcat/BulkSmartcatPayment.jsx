import React, { useState, useCallback } from 'react';
import { useMutation, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
    Upload, FileSpreadsheet, CheckCircle2, XCircle, 
    Loader2, AlertTriangle, DollarSign, Trash2, Send
} from "lucide-react";

const SERVICE_TYPES = ['Translation', 'Editing', 'Proofreading', 'Postediting', 'Review', 'QA', 'Other'];
const UNIT_TYPES = ['Words', 'Characters', 'Pages', 'Hours', 'Fixed'];

export default function BulkSmartcatPayment() {
    const [parsedData, setParsedData] = useState([]);
    const [processingResults, setProcessingResults] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Fetch freelancers from our system for matching
    const { data: freelancers = [] } = useQuery({
        queryKey: ['freelancers'],
        queryFn: () => base44.entities.Freelancer.filter({ status: 'Approved' }),
        staleTime: 300000,
    });

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (!['csv', 'xlsx', 'xls'].includes(fileExtension)) {
            toast.error('Please upload a CSV or Excel file');
            return;
        }

        try {
            // Upload file and extract data
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            
            const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
                file_url,
                json_schema: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            freelancer_name: { type: "string" },
                            freelancer_email: { type: "string" },
                            invoice_no: { type: "string" },
                            amount: { type: "number" },
                            currency: { type: "string" },
                            service_type: { type: "string" },
                            units_type: { type: "string" },
                            units_amount: { type: "number" },
                            price_per_unit: { type: "number" },
                            description: { type: "string" }
                        }
                    }
                }
            });

            if (result.status === 'success' && result.output) {
                // Match with Smartcat users
                const dataWithMatches = result.output.map(row => {
                    const matchedLinguist = linguists.find(l => 
                        l.email?.toLowerCase() === row.freelancer_email?.toLowerCase() ||
                        l.name?.toLowerCase().includes(row.freelancer_name?.toLowerCase())
                    );
                    
                    return {
                        ...row,
                        smartcat_user_id: matchedLinguist?.id || null,
                        smartcat_matched: !!matchedLinguist,
                        service_type: row.service_type || 'Translation',
                        units_type: row.units_type || 'Words',
                        currency: row.currency || 'USD',
                        status: 'pending'
                    };
                });

                setParsedData(dataWithMatches);
                setProcessingResults([]);
                toast.success(`Loaded ${dataWithMatches.length} payment records`);
            } else {
                toast.error('Failed to parse file');
            }
        } catch (error) {
            console.error('File upload error:', error);
            toast.error('Failed to process file');
        }
    };

    const updateRow = (index, field, value) => {
        setParsedData(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const removeRow = (index) => {
        setParsedData(prev => prev.filter((_, i) => i !== index));
    };

    const processPayments = async () => {
        const validPayments = parsedData.filter(p => p.smartcat_user_id);
        
        if (validPayments.length === 0) {
            toast.error('No valid payments to process. Make sure freelancers are matched with Smartcat.');
            return;
        }

        setIsProcessing(true);
        const results = [];

        for (let i = 0; i < validPayments.length; i++) {
            const payment = validPayments[i];
            
            try {
                const response = await base44.functions.invoke('smartcat', {
                    action: 'createPayable',
                    payableData: {
                        userId: payment.smartcat_user_id,
                        serviceType: payment.service_type,
                        jobDescription: payment.description || `Invoice: ${payment.invoice_no}`,
                        unitsType: payment.units_type,
                        unitsAmount: payment.units_amount || 1,
                        pricePerUnit: payment.price_per_unit || payment.amount,
                        currency: payment.currency,
                    }
                });

                results.push({
                    ...payment,
                    status: response.data?.success ? 'success' : 'failed',
                    error: response.data?.error
                });
            } catch (error) {
                results.push({
                    ...payment,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        setProcessingResults(results);
        setIsProcessing(false);

        const successCount = results.filter(r => r.status === 'success').length;
        const failCount = results.filter(r => r.status === 'failed').length;

        if (successCount > 0) {
            toast.success(`Successfully created ${successCount} payments`);
        }
        if (failCount > 0) {
            toast.error(`${failCount} payments failed`);
        }
    };

    const totalAmount = parsedData.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
    const matchedCount = parsedData.filter(p => p.smartcat_matched).length;

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                        Bulk Payment Upload
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-green-300 transition-colors">
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="bulk-payment-upload"
                            />
                            <label htmlFor="bulk-payment-upload" className="cursor-pointer">
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-lg font-medium text-gray-700">
                                    Upload CSV or Excel file
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Required columns: freelancer_name, freelancer_email, invoice_no, amount
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Optional: currency, service_type, units_type, units_amount, price_per_unit, description
                                </p>
                            </label>
                        </div>

                        {/* Sample Format */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Expected CSV format:</p>
                            <code className="text-xs text-gray-600 block bg-white p-2 rounded border">
                                freelancer_name,freelancer_email,invoice_no,amount,currency,service_type,description<br/>
                                John Doe,john@example.com,INV-001,150.00,USD,Translation,January work
                            </code>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Parsed Data Table */}
            {parsedData.length > 0 && (
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-green-600" />
                                Payment Records ({parsedData.length})
                            </CardTitle>
                            <div className="flex items-center gap-4">
                                <Badge variant="outline" className="text-base">
                                    Total: ${totalAmount.toFixed(2)}
                                </Badge>
                                <Badge className={matchedCount === parsedData.length ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                    {matchedCount}/{parsedData.length} Matched
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Freelancer</TableHead>
                                        <TableHead>Invoice</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Smartcat Match</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedData.map((row, index) => {
                                        const result = processingResults.find(r => r.invoice_no === row.invoice_no);
                                        return (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{row.freelancer_name}</div>
                                                        <div className="text-sm text-gray-500">{row.freelancer_email}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{row.invoice_no}</TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={row.service_type}
                                                        onValueChange={(v) => updateRow(index, 'service_type', v)}
                                                    >
                                                        <SelectTrigger className="w-32">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {SERVICE_TYPES.map(t => (
                                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="number"
                                                            value={row.amount}
                                                            onChange={(e) => updateRow(index, 'amount', parseFloat(e.target.value))}
                                                            className="w-24"
                                                        />
                                                        <span className="text-gray-500">{row.currency}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {row.smartcat_matched ? (
                                                        <Badge className="bg-green-100 text-green-700">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                                            Matched
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-yellow-100 text-yellow-700">
                                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                                            Not Found
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {result ? (
                                                        result.status === 'success' ? (
                                                            <Badge className="bg-green-100 text-green-700">
                                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                Success
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-red-100 text-red-700">
                                                                <XCircle className="w-3 h-3 mr-1" />
                                                                Failed
                                                            </Badge>
                                                        )
                                                    ) : (
                                                        <Badge variant="outline">Pending</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeRow(index)}
                                                    >
                                                        <Trash2 className="w-4 h-4 text-gray-400" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex justify-between items-center mt-6 pt-4 border-t">
                            <div className="text-sm text-gray-500">
                                {matchedCount < parsedData.length && (
                                    <span className="text-yellow-600">
                                        ⚠️ {parsedData.length - matchedCount} freelancers not found in Smartcat
                                    </span>
                                )}
                            </div>
                            <Button
                                onClick={processPayments}
                                disabled={isProcessing || matchedCount === 0}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Process {matchedCount} Payments
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}