import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    DollarSign, FileText
} from "lucide-react";

import InvoiceImport from "../components/payments/InvoiceImport";
import PaymentsTab from "../components/payments/PaymentsTab";

export default function SmartcatIntegrationPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    const [activeTab, setActiveTab] = useState(tabParam || "invoices");

    useEffect(() => {
        if (tabParam && ['invoices', 'payments'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    // SECURITY: Only admins can access payment management
    const canAccess = user?.role === 'admin';

    if (userLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!canAccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-4xl mx-auto text-center mt-20">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    <p className="text-gray-600">You don't have permission to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
                <p className="text-gray-600">Manage invoices and payments</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                    <TabsTrigger value="invoices" className="gap-2">
                        <FileText className="w-4 h-4" />
                        Invoices
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="gap-2">
                        <DollarSign className="w-4 h-4" />
                        Payments
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="invoices">
                    <InvoiceImport />
                </TabsContent>

                <TabsContent value="payments">
                    <PaymentsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}