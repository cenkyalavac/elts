import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
    DollarSign, RefreshCw, Send, Calendar, Search, 
    CheckCircle, Clock, AlertTriangle, FileText, Users,
    Loader2, Filter, Download, Eye
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';

const STATUS_CONFIG = {
    inProgress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Clock },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
    sent: { label: 'Sent', color: 'bg-purple-100 text-purple-700', icon: Send },
};

export default function PaymentsTab() {
    const queryClient = useQueryClient();
    const [activeSubTab, setActiveSubTab] = useState('existing');
    const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPayments, setSelectedPayments] = useState(new Set());
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [paymentsToCreate, setPaymentsToCreate] = useState([]);

    // Fetch existing payments from Smartcat
    const { data: paymentsData, isLoading: paymentsLoading, refetch: refetchPayments } = useQuery({
        queryKey: ['smartcat-payments', dateFrom, dateTo],
        queryFn: async () => {
            const response = await base44.functions.invoke('smartcatPayments', {
                action: 'list_payments',
                filters: { date_from: dateFrom, date_to: dateTo }
            });
            return response.data;
        },
        enabled: !!dateFrom && !!dateTo,
        staleTime: 60000,
    });

    // Fetch invoices from Smartcat
    const { data: invoicesData, isLoading: invoicesLoading, refetch: refetchInvoices } = useQuery({
        queryKey: ['smartcat-invoices', dateFrom, dateTo],
        queryFn: async () => {
            const response = await base44.functions.invoke('smartcatPayments', {
                action: 'list_invoices',
                filters: { date_from: dateFrom, date_to: dateTo }
            });
            return response.data;
        },
        enabled: !!dateFrom && !!dateTo,
        staleTime: 60000,
    });

    // Create payments mutation
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
            setCreateDialogOpen(false);
            setConfirmDialogOpen(false);
            setPaymentsToCreate([]);
        },
        onError: (error) => {
            toast.error(`Failed to create payments: ${error.message}`);
        }
    });

    // Filter payments
    const filteredPayments = (paymentsData?.payments || []).filter(p => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            p.supplierEmail?.toLowerCase().includes(query) ||
            p.supplierName?.toLowerCase().includes(query) ||
            p.jobDescription?.toLowerCase().includes(query)
        );
    });

    // Stats
    const stats = {
        total: filteredPayments.length,
        totalAmount: filteredPayments.reduce((sum, p) => sum + (p.cost || p.unitsAmount * p.pricePerUnit || 0), 0),
        inProgress: filteredPayments.filter(p => p.status === 'inProgress').length,
        completed: filteredPayments.filter(p => p.status === 'completed' || p.status === 'paid').length,
    };

    const handleRefresh = () => {
        refetchPayments();
        refetchInvoices();
        toast.success('Refreshing data from Smartcat...');
    };

    const handleCreatePayments = () => {
        if (paymentsToCreate.length === 0) {
            toast.error('No payments to create');
            return;
        }
        setConfirmDialogOpen(true);
    };

    const confirmCreatePayments = () => {
        createPaymentsMutation.mutate(paymentsToCreate);
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Payments</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Amount</p>
                                <p className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">In Progress</p>
                                <p className="text-2xl font-bold">{stats.inProgress}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Completed</p>
                                <p className="text-2xl font-bold">{stats.completed}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-40"
                            />
                            <span className="text-gray-500">to</span>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-40"
                            />
                        </div>
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search by email, name, or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button variant="outline" onClick={handleRefresh} className="gap-2">
                            <RefreshCw className={`w-4 h-4 ${paymentsLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 bg-green-600 hover:bg-green-700">
                            <Send className="w-4 h-4" />
                            Create Payment
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Sub Tabs */}
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
                <TabsList>
                    <TabsTrigger value="existing" className="gap-2">
                        <FileText className="w-4 h-4" />
                        Payments ({filteredPayments.length})
                    </TabsTrigger>
                    <TabsTrigger value="invoices" className="gap-2">
                        <DollarSign className="w-4 h-4" />
                        Invoices ({invoicesData?.invoices?.length || 0})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="existing" className="mt-4">
                    <PaymentsTable 
                        payments={filteredPayments} 
                        isLoading={paymentsLoading} 
                    />
                </TabsContent>

                <TabsContent value="invoices" className="mt-4">
                    <InvoicesTable 
                        invoices={invoicesData?.invoices || []} 
                        isLoading={invoicesLoading} 
                    />
                </TabsContent>
            </Tabs>

            {/* Create Payment Dialog */}
            <CreatePaymentDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                paymentsToCreate={paymentsToCreate}
                setPaymentsToCreate={setPaymentsToCreate}
                onSubmit={handleCreatePayments}
            />

            {/* Confirm Dialog */}
            <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Payment Creation</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to create {paymentsToCreate.length} payment(s) in Smartcat totaling{' '}
                            <strong>
                                ${paymentsToCreate.reduce((sum, p) => sum + (p.unitsAmount * p.pricePerUnit), 0).toFixed(2)}
                            </strong>.
                            This action will create real payment records. Continue?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmCreatePayments}
                            disabled={createPaymentsMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {createPaymentsMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Payments'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function PaymentsTable({ payments, isLoading }) {
    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">Loading payments from Smartcat...</p>
                </CardContent>
            </Card>
        );
    }

    if (payments.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No payments found for the selected date range</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead className="text-right">Units</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments.map((payment, idx) => {
                        const statusConfig = STATUS_CONFIG[payment.status] || STATUS_CONFIG.inProgress;
                        const amount = payment.cost || (payment.unitsAmount * payment.pricePerUnit) || 0;
                        
                        return (
                            <TableRow key={payment.id || idx}>
                                <TableCell>
                                    <div>
                                        <p className="font-medium">{payment.supplierName || 'N/A'}</p>
                                        <p className="text-xs text-gray-500">{payment.supplierEmail}</p>
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate">
                                    {payment.jobDescription || '-'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{payment.serviceType || 'Translation'}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {payment.unitsAmount?.toLocaleString() || '-'} {payment.unitsType || 'words'}
                                </TableCell>
                                <TableCell className="text-right">
                                    ${payment.pricePerUnit?.toFixed(4) || '-'}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    ${amount.toFixed(2)} {payment.currency}
                                </TableCell>
                                <TableCell>
                                    <Badge className={statusConfig.color}>
                                        {statusConfig.label}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </Card>
    );
}

function InvoicesTable({ invoices, isLoading }) {
    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">Loading invoices from Smartcat...</p>
                </CardContent>
            </Card>
        );
    }

    if (invoices.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No invoices found for the selected date range</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Jobs</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.map((invoice, idx) => {
                        const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.sent;
                        
                        return (
                            <TableRow key={invoice.number || idx}>
                                <TableCell className="font-medium">{invoice.number}</TableCell>
                                <TableCell>
                                    {invoice.date ? format(new Date(invoice.date), 'MMM d, yyyy') : '-'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{invoice.jobs?.length || 0} jobs</Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    ${invoice.cost?.toFixed(2) || '0.00'} {invoice.currency}
                                </TableCell>
                                <TableCell>
                                    <Badge className={statusConfig.color}>
                                        {statusConfig.label}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </Card>
    );
}

function CreatePaymentDialog({ open, onOpenChange, paymentsToCreate, setPaymentsToCreate, onSubmit }) {
    const [newPayment, setNewPayment] = useState({
        supplierEmail: '',
        supplierName: '',
        serviceType: 'Translation',
        jobDescription: '',
        unitsType: 'Words',
        unitsAmount: 0,
        pricePerUnit: 0,
        currency: 'USD'
    });

    // Fetch freelancers for autocomplete
    const { data: freelancers = [] } = useQuery({
        queryKey: ['freelancers-for-payments'],
        queryFn: async () => {
            const list = await base44.entities.Freelancer.filter({ status: 'Approved' });
            return list;
        },
        staleTime: 300000,
    });

    const handleAddPayment = () => {
        if (!newPayment.supplierEmail || !newPayment.unitsAmount || !newPayment.pricePerUnit) {
            toast.error('Please fill in all required fields');
            return;
        }
        setPaymentsToCreate([...paymentsToCreate, { ...newPayment }]);
        setNewPayment({
            supplierEmail: '',
            supplierName: '',
            serviceType: 'Translation',
            jobDescription: '',
            unitsType: 'Words',
            unitsAmount: 0,
            pricePerUnit: 0,
            currency: 'USD'
        });
    };

    const handleRemovePayment = (index) => {
        setPaymentsToCreate(paymentsToCreate.filter((_, i) => i !== index));
    };

    const handleFreelancerSelect = (freelancer) => {
        setNewPayment({
            ...newPayment,
            supplierEmail: freelancer.email,
            supplierName: freelancer.full_name
        });
    };

    const totalAmount = paymentsToCreate.reduce((sum, p) => sum + (p.unitsAmount * p.pricePerUnit), 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Payment</DialogTitle>
                    <DialogDescription>
                        Create payment records in Smartcat for freelancers
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Freelancer Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Freelancer Email *</label>
                            <Input
                                value={newPayment.supplierEmail}
                                onChange={(e) => setNewPayment({ ...newPayment, supplierEmail: e.target.value })}
                                placeholder="email@example.com"
                                list="freelancer-emails"
                            />
                            <datalist id="freelancer-emails">
                                {freelancers.map(f => (
                                    <option key={f.id} value={f.email}>{f.full_name}</option>
                                ))}
                            </datalist>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Freelancer Name</label>
                            <Input
                                value={newPayment.supplierName}
                                onChange={(e) => setNewPayment({ ...newPayment, supplierName: e.target.value })}
                                placeholder="Name"
                            />
                        </div>
                    </div>

                    {/* Quick Select */}
                    {freelancers.length > 0 && (
                        <div>
                            <label className="text-sm font-medium text-gray-500">Quick Select:</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {freelancers.slice(0, 5).map(f => (
                                    <Button
                                        key={f.id}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleFreelancerSelect(f)}
                                    >
                                        {f.full_name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Payment Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Service Type</label>
                            <Input
                                value={newPayment.serviceType}
                                onChange={(e) => setNewPayment({ ...newPayment, serviceType: e.target.value })}
                                placeholder="Translation"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Input
                                value={newPayment.jobDescription}
                                onChange={(e) => setNewPayment({ ...newPayment, jobDescription: e.target.value })}
                                placeholder="EN-TR Translation"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-medium">Units *</label>
                            <Input
                                type="number"
                                value={newPayment.unitsAmount || ''}
                                onChange={(e) => setNewPayment({ ...newPayment, unitsAmount: parseFloat(e.target.value) || 0 })}
                                placeholder="1000"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Unit Type</label>
                            <Input
                                value={newPayment.unitsType}
                                onChange={(e) => setNewPayment({ ...newPayment, unitsType: e.target.value })}
                                placeholder="Words"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Rate/Unit *</label>
                            <Input
                                type="number"
                                step="0.0001"
                                value={newPayment.pricePerUnit || ''}
                                onChange={(e) => setNewPayment({ ...newPayment, pricePerUnit: parseFloat(e.target.value) || 0 })}
                                placeholder="0.05"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Currency</label>
                            <Input
                                value={newPayment.currency}
                                onChange={(e) => setNewPayment({ ...newPayment, currency: e.target.value })}
                                placeholder="USD"
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">
                            Amount: <strong>${(newPayment.unitsAmount * newPayment.pricePerUnit).toFixed(2)}</strong>
                        </p>
                        <Button onClick={handleAddPayment} variant="outline" className="gap-2">
                            + Add to Batch
                        </Button>
                    </div>

                    {/* Payments List */}
                    {paymentsToCreate.length > 0 && (
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <h4 className="font-medium mb-3">Payments to Create ({paymentsToCreate.length})</h4>
                            <div className="space-y-2">
                                {paymentsToCreate.map((p, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white p-3 rounded border">
                                        <div>
                                            <p className="font-medium">{p.supplierName || p.supplierEmail}</p>
                                            <p className="text-xs text-gray-500">
                                                {p.unitsAmount} {p.unitsType} × ${p.pricePerUnit} = ${(p.unitsAmount * p.pricePerUnit).toFixed(2)}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemovePayment(idx)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 pt-3 border-t flex justify-between items-center">
                                <p className="font-medium">Total: ${totalAmount.toFixed(2)}</p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={onSubmit} 
                        disabled={paymentsToCreate.length === 0}
                        className="bg-green-600 hover:bg-green-700 gap-2"
                    >
                        <Send className="w-4 h-4" />
                        Create {paymentsToCreate.length} Payment(s)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}