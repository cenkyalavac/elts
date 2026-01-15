import React, { useState, useCallback } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { 
    Upload, FileText, CheckCircle2, AlertTriangle, Clock,
    Download, DollarSign, ClipboardPaste, Search, Filter,
    Calendar, User, CreditCard, ArrowUpDown, Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

export default function InvoiceImport() {
    const [rawInput, setRawInput] = useState('');
    const [invoices, setInvoices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortField, setSortField] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const { data: freelancers = [] } = useQuery({
        queryKey: ['freelancers'],
        queryFn: () => base44.entities.Freelancer.list(),
    });

    const parseCSV = (text) => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];
        
        const headerLine = lines[0];
        const isTabSeparated = headerLine.includes('\t');
        const delimiter = isTabSeparated ? '\t' : /\s{2,}|,/;
        
        const headers = headerLine.split(delimiter).map(h => h.trim().replace(/"/g, ''));
        
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
            const row = {};
            headers.forEach((header, idx) => {
                row[header] = values[idx] || '';
            });
            
            // Normalize field names
            const invoice = {
                invoiceCode: row['InvoiceCode'] || row['Invoice'] || row['Code'] || '',
                resource: row['Resource'] || row['Freelancer'] || row['Name'] || '',
                status: row['Status'] || 'Pending',
                vat: parseFloat(row['VAT'] || row['Tax'] || 0),
                totalCost: parseFloat(row['TotalCost'] || row['Total'] || row['Amount'] || 0),
                currency: row['Currency'] || 'USD',
                dateSent: row['DateSent'] || row['InvoiceDate'] || row['Date'] || '',
                datePaid: row['DatePaid'] || row['PaidDate'] || '',
                // Additional fields if available
                description: row['Description'] || row['JobDescription'] || '',
                project: row['Project'] || row['ProjectCode'] || '',
                sourceLanguage: row['SourceLanguage'] || row['Source'] || '',
                targetLanguage: row['TargetLanguage'] || row['Target'] || '',
                wordCount: parseInt(row['WordCount'] || row['Words'] || 0),
                rate: parseFloat(row['Rate'] || 0),
                service: row['Service'] || row['ServiceType'] || '',
            };
            
            // Match with freelancer
            const matchedFreelancer = freelancers.find(f => 
                f.full_name?.toLowerCase() === invoice.resource.toLowerCase() ||
                f.email?.toLowerCase() === invoice.resource.toLowerCase()
            );
            
            invoice.freelancerId = matchedFreelancer?.id || null;
            invoice.freelancerMatched = !!matchedFreelancer;
            
            rows.push(invoice);
        }
        
        return rows;
    };

    const handleParse = useCallback(() => {
        if (!rawInput.trim()) return;
        const data = parseCSV(rawInput);
        setInvoices(data);
    }, [rawInput, freelancers]);

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
                    <div className="space-y-2">
                        <Label>Paste Data (Tab or Comma separated)</Label>
                        <Textarea
                            placeholder={`InvoiceCode\tResource\tStatus\tVAT\tTotalCost\tCurrency\tDateSent\tDatePaid
INV06035\tJohn Smith\tDue Today\t0\t450.14\tUSD\t15/01/2026\t
INV06034\tJane Doe\tPaid\t0\t178.48\tUSD\t14/01/2026\t14/01/2026`}
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
                                <CardTitle>Invoices ({filteredInvoices.length})</CardTitle>
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
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
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
                                        {filteredInvoices.map((invoice, idx) => (
                                            <TableRow key={idx}>
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
                                                    {getStatusBadge(invoice)}
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
                                        ))}
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
        </div>
    );
}