import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    DollarSign, FileText, AlertTriangle, Construction
} from "lucide-react";

import InvoiceImport from "../components/payments/InvoiceImport";

export default function SmartcatIntegrationPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    const [activeTab, setActiveTab] = useState(tabParam || "invoices");

    useEffect(() => {
        if (tabParam && ['invoices', 'payments'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const isAdmin = user?.role === 'admin';
    const isProjectManager = user?.role === 'project_manager';

    if (!isAdmin && !isProjectManager) {
        return (
            <div className="p-6 max-w-4xl mx-auto text-center">
                <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold">Access Restricted</h2>
                <p className="text-gray-600">Only administrators and project managers can access this page.</p>
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
                    <Card>
                        <CardContent className="pt-12 pb-12">
                            <div className="text-center">
                                <Construction className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Under Construction</h2>
                                <p className="text-gray-600 max-w-md mx-auto">
                                    The payment processing feature is currently being developed. 
                                    You can use the Invoices tab to import and view your TBMS data.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}