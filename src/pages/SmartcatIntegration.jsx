import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    DollarSign, Users, Search, Upload, RefreshCw, Send, 
    CheckCircle2, AlertTriangle, XCircle, FileText, Filter,
    Download, UserPlus, Loader2
} from "lucide-react";

import SmartcatPaymentManager from "../components/smartcat/SmartcatPaymentManager";
import SmartcatMarketplaceSearch from "../components/smartcat/SmartcatMarketplaceSearch";
import SmartcatTBMSImport from "../components/smartcat/SmartcatTBMSImport";
import SmartcatTeamSync from "../components/smartcat/SmartcatTeamSync";

export default function SmartcatIntegrationPage() {
    const [activeTab, setActiveTab] = useState("payments");

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const isAdmin = user?.role === 'admin';

    if (!isAdmin) {
        return (
            <div className="p-6 max-w-4xl mx-auto text-center">
                <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold">Erişim Kısıtlı</h2>
                <p className="text-gray-600">Bu sayfaya sadece yöneticiler erişebilir.</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Smartcat Entegrasyonu</h1>
                <p className="text-gray-600">Ödemeler, marketplace araması ve ekip yönetimi</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                    <TabsTrigger value="payments" className="gap-2">
                        <DollarSign className="w-4 h-4" />
                        Ödemeler
                    </TabsTrigger>
                    <TabsTrigger value="tbms" className="gap-2">
                        <Upload className="w-4 h-4" />
                        TBMS Import
                    </TabsTrigger>
                    <TabsTrigger value="marketplace" className="gap-2">
                        <Search className="w-4 h-4" />
                        Marketplace
                    </TabsTrigger>
                    <TabsTrigger value="team" className="gap-2">
                        <Users className="w-4 h-4" />
                        Ekip Senkronizasyonu
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="payments">
                    <SmartcatPaymentManager />
                </TabsContent>

                <TabsContent value="tbms">
                    <SmartcatTBMSImport />
                </TabsContent>

                <TabsContent value="marketplace">
                    <SmartcatMarketplaceSearch />
                </TabsContent>

                <TabsContent value="team">
                    <SmartcatTeamSync />
                </TabsContent>
            </Tabs>
        </div>
    );
}