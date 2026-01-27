import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { 
    Upload, FileText, CheckCircle2, AlertTriangle, Clock,
    Download, DollarSign, ClipboardPaste, Search, Filter,
    Calendar, User, CreditCard, ArrowUpDown, Eye, Send, Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import CsvMappingManager from "./CsvMappingManager";

// Service types supported by Smartcat
const SERVICE_TYPES = [
    'Translation', 'Editing', 'Proofreading', 'Postediting', 'Copywriting',
    'TranslationAndEditing', 'QualityAssurance', 'Dtp', 'Testing', 'Review',
    'Interpreting', 'Transcription', 'Subtitling', 'VoiceOver', 'Other'
];

// Unit types supported by Smartcat
const UNIT_TYPES = ['Words', 'Characters', 'Hours', 'Pages', 'Documents'];

// Currencies supported
const CURRENCIES = ['USD', 'EUR', 'GBP', 'TRY'];

export default function InvoiceImport() {
    const queryClient = useQueryClient();
    const [rawInput, setRawInput] = useState('');
    const [invoices, setInvoices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortField, setSortField] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedForPayment, setSelectedForPayment] = useState(new Set());
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    
    // Detected CSV columns for mapping
    const [detectedColumns, setDetectedColumns] = useState([]);
    
    // Column mapping configuration
    const [columnMapping, setColumnMapping] = useState({});
    
    // Default values for Smartcat payment creation
    const [defaults, setDefaults] = useState({
        serviceType: 'Translation',
        unitsType: 'Words',
        currency: 'USD'
    });

    const { data: freelancers = [] } = useQuery({
        queryKey: ['freelancers'],
        queryFn: () => base44.entities.Freelancer.list(),
    });

    const parseCSV = (text, customMapping = null) => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];
        
        const headerLine = lines[0];
        const isTabSeparated = headerLine.includes('\t');
        const delimiter = isTabSeparated ? '\t' : /\s{2,}|,/;
        
        const headers = headerLine.split(delimiter).map(h => h.trim().replace(/"/g, ''));
        
        // Update detected columns for mapping UI
        setDetectedColumns(headers);
        
        // Use custom mapping if provided, otherwise use default mapping logic
        const mapping = customMapping || columnMapping;
        const hasCustomMapping = Object.values(mapping).some(v => v);
        
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
            const row = {};
            headers.forEach((header, idx) => {
                row[header] = values[idx] || '';
            });
            
            // Get value from row using mapping or fallback to default column names
            const getValue = (field, fallbacks = []) => {
                // First check custom mapping
                if (hasCustomMapping && mapping[field]) {
                    return row[mapping[field]] || '';
                }
                // Fallback to default column detection
                for (const fb of fallbacks) {
                    if (row[fb] !== undefined && row[fb] !== '') {
                        return row[fb];
                    }
                }
                return '';
            };
            
            // Normalize field names using mapping or fallbacks
            const invoice = {
                invoiceCode: getValue('invoiceCode', ['InvoiceCode', 'Invoice', 'Code', 'InvoiceNumber', 'Ref']),
                resource: getValue('resource', ['Resource', 'Freelancer', 'Name', 'Translator', 'Vendor', 'Supplier']),
                status: getValue('status', ['Status']) || 'Pending',
                vat: parseFloat(getValue('vat', ['VAT', 'Tax']) || 0),
                totalCost: parseFloat(getValue('totalCost', ['TotalCost', 'Total', 'Amount', 'Cost', 'Payment', 'Sum']) || 0),
                currency: getValue('currency', ['Currency']) || defaults.currency,
                dateSent: getValue('dateSent', ['DateSent', 'InvoiceDate', 'Date', 'Created']),
                datePaid: getValue('datePaid', ['DatePaid', 'PaidDate', 'PaymentDate']),
                // Additional fields if available
                description: getValue('description', ['Description', 'JobDescription', 'Details']),
                project: getValue('project', ['Project', 'ProjectCode', 'ProjectName']),
                sourceLanguage: getValue('sourceLanguage', ['SourceLanguage', 'Source', 'From']),
                targetLanguage: getValue('targetLanguage', ['TargetLanguage', 'Target', 'To']),
                wordCount: parseInt(getValue('wordCount', ['WordCount', 'Words', 'Volume', 'Units']) || 0),
                rate: parseFloat(getValue('rate', ['Rate', 'PricePerWord', 'UnitPrice']) || 0),
                service: getValue('service', ['Service', 'ServiceType', 'Type']),
            };
            
            // Match with freelancer - try multiple fields
            const resourceLower = invoice.resource.toLowerCase().trim();
            const matchedFreelancer = freelancers.find(f => {
                // Match by full name
                if (f.full_name?.toLowerCase().trim() === resourceLower) return true;
                // Match by email
                if (f.email?.toLowerCase().trim() === resourceLower) return true;
                // Match by resource_code
                if (f.resource_code?.toLowerCase().trim() === resourceLower) return true;
                // Match by email2
                if (f.email2?.toLowerCase().trim() === resourceLower) return true;
                // Match by smartcat_supplier_id
                if (f.smartcat_supplier_id?.toLowerCase().trim() === resourceLower) return true;
                // Partial name match (first + last name)
                const nameParts = resourceLower.split(' ');
                if (nameParts.length >= 2) {
                    const fullNameLower = f.full_name?.toLowerCase() || '';
                    if (fullNameLower.includes(nameParts[0]) && fullNameLower.includes(nameParts[nameParts.length - 1])) {
                        return true;
                    }
                }
                return false;
            });
            
            invoice.freelancerId = matchedFreelancer?.id || null;
            invoice.freelancerEmail = matchedFreelancer?.email || null;
            invoice.freelancerMatched = !!matchedFreelancer;
            invoice.smartcatSupplierId = matchedFreelancer?.smartcat_supplier_id || null;
            
            // Validate for Smartcat - check required fields
            invoice.validationErrors = [];
            if (!invoice.freelancerMatched) {
                invoice.validationErrors.push('Freelancer not found in database');
            }
            if (!invoice.totalCost || invoice.totalCost <= 0) {
                invoice.validationErrors.push('Invalid amount');
            }
            if (!invoice.invoiceCode) {
                invoice.validationErrors.push('Missing invoice code');
            }
            invoice.isValidForSmartcat = invoice.validationErrors.length === 0;
            
            rows.push(invoice);
        }
        
        return rows;
    };

    const handleParse = useCallback(() => {
        if (!rawInput.trim()) return;
        const data = parseCSV(rawInput, columnMapping);
        setInvoices(data);
    }, [rawInput, freelancers, columnMapping, defaults]);
    
    // Handle mapping changes from CsvMappingManager
    const handleApplyMapping = (newMapping, newDefaults) => {
        setColumnMapping(newMapping);
        setDefaults(newDefaults);
        // Re-parse with new mapping if we have data
        if (rawInput.trim()) {
            const data = parseCSV(rawInput, newMapping);
            setInvoices(data);
        }
    };

    const handleFileUpload = useCallback((e) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result;
            setRawInput(text);
            const data = parseCSV(text);
            setInvoices(data);
        };
        reader.readAsText(uploadedFile);
    }, [freelancers]);

    // Create Smartcat payments mutation
    const createPaymentsMutation = useMutation({
        mutationFn: async (payments) => {
            const response = await base44.functions.invoke('smartcatPayments', {
                action: 'create_payments',
                filters: { payments }
            });
            return response.data;
        },
        onSuccess: (data) => {
            toast.success(`Created ${data.created} payment(s) in Smartcat`);
            queryClient.invalidateQueries({ queryKey: ['smartcat-payments'] });
            setSelectedForPayment(new Set());
            setConfirmDialogOpen(false);
            
            // Mark these invoices as "sent to Smartcat" locally
            setInvoices(prev => prev.map(inv => {
                if (selectedForPayment.has(inv.invoiceCode)) {
                    return { ...inv, sentToSmartcat: true };
                }
                return inv;
            }));
        },
        onError: (error) => {
            toast.error(`Failed to create payments: ${error.message}`);
        }
    });

    const downloadCSV = () => {
        if (invoices.length === 0) return;
        
        const headers = ['InvoiceCode', 'Resource', 'Status', 'TotalCost', 'Currency', 'VAT', 'DateSent', 'DatePaid', 'Project', 'Service', 'WordCount', 'Rate'];
        const rows = invoices.map(inv => [
            inv.invoiceCode,
            inv.resource,
            inv.status,
            inv.totalCost,
            inv.currency,
            inv.vat,
            inv.dateSent,
            inv.datePaid,
            inv.project,
            inv.service,
            inv.wordCount,
            inv.rate
        ].map(v => `"${v || ''}"`).join(','));
        
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Toggle selection for payment
    const toggleSelection = (invoiceCode) => {
        setSelectedForPayment(prev => {
            const newSet = new Set(prev);
            if (newSet.has(invoiceCode)) {
                newSet.delete(invoiceCode);
            } else {
                newSet.add(invoiceCode);
            }
            return newSet;
        });
    };

    // Select all pending (unpaid) invoices that are valid for Smartcat
    const selectAllPending = () => {
        const pendingValid = filteredInvoices.filter(inv => 
            !inv.datePaid && inv.isValidForSmartcat && !inv.sentToSmartcat
        );
        setSelectedForPayment(new Set(pendingValid.map(inv => inv.invoiceCode)));
    };

    // Get selected invoices data
    const getSelectedInvoices = () => {
        return invoices.filter(inv => selectedForPayment.has(inv.invoiceCode));
    };

    // Convert invoices to Smartcat payment format
    const convertToSmartcatPayments = () => {
        const selected = getSelectedInvoices();
        return selected.map(inv => {
            const freelancer = freelancers.find(f => f.id === inv.freelancerId);
            
            // Determine service type - from CSV or default
            const serviceType = inv.service && SERVICE_TYPES.includes(inv.service) 
                ? inv.service 
                : defaults.serviceType;
            
            // Determine units type and amount
            let unitsType = defaults.unitsType;
            let unitsAmount = 1;
            let pricePerUnit = inv.totalCost;
            
            if (inv.wordCount > 0) {
                unitsType = 'Words';
                unitsAmount = inv.wordCount;
                pricePerUnit = inv.totalCost / inv.wordCount;
            } else if (defaults.unitsType === 'Documents') {
                unitsType = 'Documents';
                unitsAmount = 1;
                pricePerUnit = inv.totalCost;
            }
            
            // Currency from CSV or default
            const currency = inv.currency && CURRENCIES.includes(inv.currency.toUpperCase())
                ? inv.currency.toUpperCase()
                : defaults.currency;
            
            // Build payment object - use smartcat_supplier_id if available
            const payment = {
                supplierEmail: freelancer?.email || inv.freelancerEmail || '',
                supplierName: inv.resource,
                supplierType: 'freelancer',
                serviceType,
                jobDescription: `${inv.invoiceCode}${inv.project ? ' - ' + inv.project : ''}${inv.description ? ' - ' + inv.description : ''}`.trim() || 'Invoice payment',
                unitsType,
                unitsAmount,
                pricePerUnit,
                currency,
                externalNumber: inv.invoiceCode
            };
            
            // Add smartcat_supplier_id if freelancer has one (for future API support)
            if (freelancer?.smartcat_supplier_id) {
                payment.freelancerId = freelancer.smartcat_supplier_id;
            }
            
            return payment;
        });
    };

    const handleCreatePayments = () => {
        const selected = getSelectedInvoices();
        
        // Check if any selected invoice has validation errors
        const invalidInvoices = selected.filter(inv => !inv.isValidForSmartcat);
        if (invalidInvoices.length > 0) {
            toast.error(`${invalidInvoices.length} invoice(s) have validation errors. Please fix them first.`);
            return;
        }
        
        const payments = convertToSmartcatPayments();
        
        // Final validation - check all have email
        const missingEmail = payments.filter(p => !p.supplierEmail);
        if (missingEmail.length > 0) {
            toast.error(`${missingEmail.length} invoice(s) missing freelancer email.`);
            return;
        }
        
        // Validate amounts
        const invalidAmounts = payments.filter(p => !p.pricePerUnit || p.pricePerUnit <= 0 || !p.unitsAmount || p.unitsAmount <= 0);
        if (invalidAmounts.length > 0) {
            toast.error(`${invalidAmounts.length} invoice(s) have invalid amounts.`);
            return;
        }
        
        createPaymentsMutation.mutate(payments);
    };

    // Count valid invoices for selection
    const validPendingCount = filteredInvoices.filter(inv => 
        !inv.datePaid && inv.isValidForSmartcat && !inv.sentToSmartcat
    ).length;

    const selectedTotal = getSelectedInvoices().reduce((sum, inv) => sum + inv.totalCost, 0);

    // Filter and sort invoices
    const filteredInvoices = invoices
        .filter(inv => {
            const matchesSearch = 
                inv.invoiceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inv.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inv.project?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === 'all' || 
                (statusFilter === 'paid' && inv.datePaid) ||
                (statusFilter === 'pending' && !inv.datePaid && !inv.status.toLowerCase().includes('overdue')) ||
                (statusFilter === 'overdue' && inv.status.toLowerCase().includes('overdue'));
            
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            let aVal, bVal;
            switch (sortField) {
                case 'amount':
                    aVal = a.totalCost;
                    bVal = b.totalCost;
                    break;
                case 'name':
                    aVal = a.resource;
                    bVal = b.resource;
                    break;
                case 'date':
                default:
                    aVal = a.dateSent;
                    bVal = b.dateSent;
            }
            if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
            return aVal < bVal ? 1 : -1;
        });

    // Calculate summary
    const summary = {
        total: invoices.reduce((sum, inv) => sum + inv.totalCost, 0),
        paid: invoices.filter(inv => inv.datePaid).reduce((sum, inv) => sum + inv.totalCost, 0),
        pending: invoices.filter(inv => !inv.datePaid).reduce((sum, inv) => sum + inv.totalCost, 0),
        overdue: invoices.filter(inv => inv.status.toLowerCase().includes('overdue')).reduce((sum, inv) => sum + inv.totalCost, 0),
        count: invoices.length,
        paidCount: invoices.filter(inv => inv.datePaid).length,
        pendingCount: invoices.filter(inv => !inv.datePaid && !inv.status.toLowerCase().includes('overdue')).length,
        overdueCount: invoices.filter(inv => inv.status.toLowerCase().includes('overdue')).length,
    };

    const getStatusBadge = (invoice) => {
        if (invoice.datePaid) {
            return <Badge className="bg-green-100 text-green-700">Paid</Badge>;
        }
        if (invoice.status.toLowerCase().includes('overdue')) {
            return <Badge className="bg-red-100 text-red-700">Overdue</Badge>;
        }
        if (invoice.status.toLowerCase().includes('due today')) {
            return <Badge className="bg-amber-100 text-amber-700">Due Today</Badge>;
        }
        return <Badge variant="outline">Pending</Badge>;
    };

    return (
        <div className="space-y-6">
            {/* Import Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Import Invoices
                    </CardTitle>
                    <CardDescription>
                        Paste your TBMS export data or upload a CSV file. All columns will be imported and displayed.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Default Values & Column Mapping Section */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Default Values for Smartcat</Label>
                                <p className="text-xs text-gray-500">These will be used when CSV doesn't have these fields</p>
                            </div>
                            <CsvMappingManager 
                                detectedColumns={detectedColumns}
                                onApplyMapping={handleApplyMapping}
                                currentMapping={columnMapping}
                                currentDefaults={defaults}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label className="text-xs">Service Type</Label>
                                <Select value={defaults.serviceType} onValueChange={(v) => setDefaults({...defaults, serviceType: v})}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SERVICE_TYPES.map(t => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs">Unit Type</Label>
                                <Select value={defaults.unitsType} onValueChange={(v) => setDefaults({...defaults, unitsType: v})}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {UNIT_TYPES.map(t => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs">Currency</Label>
                                <Select value={defaults.currency} onValueChange={(v) => setDefaults({...defaults, currency: v})}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CURRENCIES.map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Paste Data (Tab or Comma separated)</Label>
                        <Textarea
                            placeholder={`InvoiceCode\tResource\tStatus\tVAT\tTotalCost\tCurrency\tDateSent\tDatePaid\tWordCount\tService
INV06035\tJohn Smith\tDue Today\t0\t450.14\tUSD\t15/01/2026\t\t5000\tTranslation
INV06034\tJane Doe\tPaid\t0\t178.48\tUSD\t14/01/2026\t14/01/2026\t2000\tEditing`}
                            value={rawInput}
                            onChange={(e) => setRawInput(e.target.value)}
                            rows={6}
                            className="font-mono text-sm"
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleParse} disabled={!rawInput.trim()}>
                                <ClipboardPaste className="w-4 h-4 mr-2" />
                                Parse Data
                            </Button>
                            <span className="text-gray-400 self-center">or</span>
                            <div>
                                <input
                                    type="file"
                                    accept=".csv,.tsv,.txt"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="invoice-upload"
                                />
                                <label htmlFor="invoice-upload">
                                    <Button variant="outline" asChild>
                                        <span className="cursor-pointer">
                                            <FileText className="w-4 h-4 mr-2" />
                                            Upload File
                                        </span>
                                    </Button>
                                </label>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {invoices.length > 0 && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <DollarSign className="w-8 h-8 text-blue-600" />
                                    <div>
                                        <p className="text-sm text-blue-600">Total</p>
                                        <p className="text-2xl font-bold text-blue-700">
                                            ${summary.total.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-blue-500">{summary.count} invoices</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                                    <div>
                                        <p className="text-sm text-green-600">Paid</p>
                                        <p className="text-2xl font-bold text-green-700">
                                            ${summary.paid.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-green-500">{summary.paidCount} invoices</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-amber-50 border-amber-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <Clock className="w-8 h-8 text-amber-600" />
                                    <div>
                                        <p className="text-sm text-amber-600">Pending</p>
                                        <p className="text-2xl font-bold text-amber-700">
                                            ${summary.pending.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-amber-500">{summary.pendingCount} invoices</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-red-50 border-red-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="w-8 h-8 text-red-600" />
                                    <div>
                                        <p className="text-sm text-red-600">Overdue</p>
                                        <p className="text-2xl font-bold text-red-700">
                                            ${summary.overdue.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-red-500">{summary.overdueCount} invoices</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Invoice List */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Invoices ({filteredInvoices.length})</CardTitle>
                                    {selectedForPayment.size > 0 && (
                                        <p className="text-sm text-purple-600 mt-1">
                                            {selectedForPayment.size} selected · ${selectedTotal.toFixed(2)} total
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            placeholder="Search..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 w-48"
                                        />
                                    </div>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-32">
                                            <Filter className="w-4 h-4 mr-2" />
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="overdue">Overdue</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={sortField} onValueChange={setSortField}>
                                        <SelectTrigger className="w-32">
                                            <ArrowUpDown className="w-4 h-4 mr-2" />
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="date">Date</SelectItem>
                                            <SelectItem value="amount">Amount</SelectItem>
                                            <SelectItem value="name">Name</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" size="icon" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                                        <ArrowUpDown className={`w-4 h-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                                    </Button>
                                    <Button variant="outline" onClick={downloadCSV}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Export
                                    </Button>
                                </div>
                            </div>

                            {/* Payment Actions */}
                            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
                                <Button variant="outline" size="sm" onClick={selectAllPending}>
                                    Select All Valid ({validPendingCount})
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setSelectedForPayment(new Set())}
                                    disabled={selectedForPayment.size === 0}
                                >
                                    Clear Selection
                                </Button>
                                <div className="flex-1" />
                                <Button 
                                    onClick={() => setConfirmDialogOpen(true)}
                                    disabled={selectedForPayment.size === 0}
                                    className="bg-green-600 hover:bg-green-700 gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    Send to Smartcat ({selectedForPayment.size})
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-10"></TableHead>
                                            <TableHead>Invoice</TableHead>
                                            <TableHead>Resource</TableHead>
                                            <TableHead>Project</TableHead>
                                            <TableHead>Service</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredInvoices.map((invoice, idx) => {
                                            const canSelect = !invoice.datePaid && invoice.isValidForSmartcat && !invoice.sentToSmartcat;
                                            const isSelected = selectedForPayment.has(invoice.invoiceCode);
                                            
                                            return (
                                                <TableRow 
                                                    key={idx}
                                                    className={`${isSelected ? 'bg-purple-50' : ''} ${invoice.validationErrors?.length > 0 && !invoice.datePaid ? 'bg-amber-50/50' : ''}`}
                                                >
                                                    <TableCell>
                                                        {canSelect ? (
                                                            <Checkbox 
                                                                checked={isSelected}
                                                                onCheckedChange={() => toggleSelection(invoice.invoiceCode)}
                                                            />
                                                        ) : invoice.sentToSmartcat ? (
                                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                        ) : invoice.validationErrors?.length > 0 ? (
                                                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                        ) : null}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm font-medium">
                                                        {invoice.invoiceCode}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {invoice.freelancerId ? (
                                                                <Link 
                                                                    to={createPageUrl(`FreelancerDetail?id=${invoice.freelancerId}`)}
                                                                    className="text-blue-600 hover:underline font-medium"
                                                                >
                                                                    {invoice.resource}
                                                                </Link>
                                                            ) : (
                                                                <span className="font-medium">{invoice.resource}</span>
                                                            )}
                                                            {!invoice.freelancerMatched && (
                                                                <Badge variant="outline" className="text-xs text-amber-600">
                                                                    Not in DB
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-600">
                                                        {invoice.project || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-600">
                                                        {invoice.service || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">
                                                        {invoice.currency} {invoice.totalCost.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1 flex-wrap">
                                                            {getStatusBadge(invoice)}
                                                            {invoice.sentToSmartcat && (
                                                                <Badge className="bg-purple-100 text-purple-700 text-xs">
                                                                    Sent
                                                                </Badge>
                                                            )}
                                                            {invoice.validationErrors?.length > 0 && !invoice.datePaid && (
                                                                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                                                    {invoice.validationErrors.length} issue{invoice.validationErrors.length > 1 ? 's' : ''}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-600">
                                                        {invoice.dateSent}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                            onClick={() => setSelectedInvoice(invoice)}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Invoice Detail Dialog */}
            <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Invoice {selectedInvoice?.invoiceCode}
                        </DialogTitle>
                    </DialogHeader>
                    
                    {selectedInvoice && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-gray-500">Resource</Label>
                                    <p className="font-medium">{selectedInvoice.resource}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">Status</Label>
                                    <div className="mt-1">{getStatusBadge(selectedInvoice)}</div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-gray-500">Amount</Label>
                                    <p className="text-xl font-bold">{selectedInvoice.currency} {selectedInvoice.totalCost.toFixed(2)}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">VAT</Label>
                                    <p className="font-medium">{selectedInvoice.vat.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-gray-500">Date Sent</Label>
                                    <p className="font-medium">{selectedInvoice.dateSent || '-'}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">Date Paid</Label>
                                    <p className="font-medium">{selectedInvoice.datePaid || '-'}</p>
                                </div>
                            </div>

                            {(selectedInvoice.project || selectedInvoice.service) && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-gray-500">Project</Label>
                                        <p className="font-medium">{selectedInvoice.project || '-'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-gray-500">Service</Label>
                                        <p className="font-medium">{selectedInvoice.service || '-'}</p>
                                    </div>
                                </div>
                            )}

                            {(selectedInvoice.sourceLanguage || selectedInvoice.targetLanguage) && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-gray-500">Language Pair</Label>
                                        <p className="font-medium">
                                            {selectedInvoice.sourceLanguage} → {selectedInvoice.targetLanguage}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-gray-500">Word Count</Label>
                                        <p className="font-medium">{selectedInvoice.wordCount || '-'}</p>
                                    </div>
                                </div>
                            )}

                            {selectedInvoice.rate > 0 && (
                                <div>
                                    <Label className="text-xs text-gray-500">Rate</Label>
                                    <p className="font-medium">{selectedInvoice.currency} {selectedInvoice.rate.toFixed(4)}/word</p>
                                </div>
                            )}

                            {selectedInvoice.description && (
                                <div>
                                    <Label className="text-xs text-gray-500">Description</Label>
                                    <p className="text-sm">{selectedInvoice.description}</p>
                                </div>
                            )}

                            {/* Validation Errors */}
                            {selectedInvoice.validationErrors?.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <Label className="text-xs text-amber-700 font-medium">Validation Issues</Label>
                                    <ul className="text-sm text-amber-600 mt-1 space-y-1">
                                        {selectedInvoice.validationErrors.map((err, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <AlertTriangle className="w-3 h-3" />
                                                {err}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Smartcat Payment Preview */}
                            {selectedInvoice.isValidForSmartcat && !selectedInvoice.datePaid && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <Label className="text-xs text-green-700 font-medium">Smartcat Payment Preview</Label>
                                    <div className="text-sm text-green-600 mt-1 space-y-1">
                                        <p><strong>Service:</strong> {selectedInvoice.service || defaults.serviceType}</p>
                                        <p><strong>Units:</strong> {selectedInvoice.wordCount > 0 ? `${selectedInvoice.wordCount} Words` : `1 ${defaults.unitsType}`}</p>
                                        <p><strong>Rate:</strong> {selectedInvoice.wordCount > 0 
                                            ? `${(selectedInvoice.totalCost / selectedInvoice.wordCount).toFixed(4)}/word`
                                            : `${selectedInvoice.totalCost.toFixed(2)} total`
                                        }</p>
                                    </div>
                                </div>
                            )}

                            {selectedInvoice.freelancerId && (
                                <div className="pt-4 border-t">
                                    <Link to={createPageUrl(`FreelancerDetail?id=${selectedInvoice.freelancerId}`)}>
                                        <Button variant="outline" className="w-full">
                                            <User className="w-4 h-4 mr-2" />
                                            View Freelancer Profile
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Confirm Send to Smartcat Dialog */}
            <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <AlertDialogContent className="max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Send to Smartcat</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>
                                    You are about to create <strong>{selectedForPayment.size}</strong> payment(s) 
                                    in Smartcat totaling <strong>${selectedTotal.toFixed(2)}</strong>.
                                </p>
                                <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto text-sm">
                                    {getSelectedInvoices().map(inv => {
                                        const payment = convertToSmartcatPayments().find(p => p.externalNumber === inv.invoiceCode);
                                        return (
                                            <div key={inv.invoiceCode} className="py-2 border-b last:border-0 space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="font-medium">{inv.resource}</span>
                                                    <span className="font-bold">{payment?.currency} {inv.totalCost.toFixed(2)}</span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {payment?.serviceType} · {payment?.unitsAmount} {payment?.unitsType} · {payment?.pricePerUnit?.toFixed(4)}/{payment?.unitsType?.slice(0,-1)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="text-xs text-gray-500 bg-gray-100 rounded p-2">
                                    <strong>Defaults:</strong> {defaults.serviceType} · {defaults.unitsType} · {defaults.currency}
                                </div>
                                <p className="text-amber-600 text-sm">
                                    ⚠️ This will create real payment records in Smartcat. Make sure the amounts are correct.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCreatePayments}
                            disabled={createPaymentsMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {createPaymentsMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Create Payments
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}