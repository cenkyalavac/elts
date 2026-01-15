import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, Clock, AlertCircle, BarChart3, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DocumentUploadForm from '@/components/documents/DocumentUploadForm';
import DocumentsManagement from '@/components/documents/DocumentsManagement';

export default function DocumentCompliancePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showUploadForm, setShowUploadForm] = useState(false);

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            try {
                return await base44.auth.me();
            } catch {
                return null;
            }
        },
    });

    const { data: complianceData, isLoading, refetch } = useQuery({
        queryKey: ['documentComplianceStatus'],
        queryFn: async () => {
            const response = await base44.functions.invoke('getDocumentSigningStatus', {});
            return response.data;
        },
        enabled: !!user && user.role === 'admin',
        refetchInterval: 30000
    });

    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <Card className="p-8 text-center">
                    <h2 className="text-xl font-semibold">Access Denied</h2>
                </Card>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <Card className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p className="text-gray-600">Loading compliance data...</p>
                </Card>
            </div>
        );
    }

    const overallColor = complianceData?.overall_compliance >= 80 
        ? 'bg-green-100 border-green-300' 
        : complianceData?.overall_compliance >= 50 
        ? 'bg-yellow-100 border-yellow-300'
        : 'bg-red-100 border-red-300';

    const complianceChartData = complianceData?.documents?.map(doc => ({
        name: doc.title,
        signed: doc.signed_count,
        unsigned: doc.total_count - doc.signed_count,
        compliance: doc.compliance_percent
    })) || [];

    const pieData = [
        { name: 'Signed', value: complianceData?.total_signatures_signed || 0 },
        { name: 'Unsigned', value: (complianceData?.total_signatures_required || 0) - (complianceData?.total_signatures_signed || 0) }
    ];

    const filteredFreelancers = Object.entries(complianceData?.compliance_by_freelancer || {})
        .filter(([name]) => name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => b[1].compliance_percent - a[1].compliance_percent);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Document Compliance</h1>
                        <p className="text-gray-600 mt-1 text-sm sm:text-base">Track document signing status and compliance</p>
                    </div>
                    <Button
                        onClick={() => setShowUploadForm(!showUploadForm)}
                        className="gap-2 w-full sm:w-auto"
                    >
                        Upload Document
                    </Button>
                </div>

                {/* Upload Form */}
                {showUploadForm && (
                    <div className="mb-6">
                        <DocumentUploadForm onSuccess={() => {
                            refetch();
                            setShowUploadForm(false);
                        }} />
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className={`p-4 ${overallColor}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Overall Compliance</p>
                                <p className="text-3xl font-bold mt-1">{complianceData?.overall_compliance || 0}%</p>
                            </div>
                            <BarChart3 className="w-8 h-8 text-gray-400" />
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div>
                            <p className="text-sm font-medium text-gray-700">Total Signatures</p>
                            <p className="text-3xl font-bold mt-1 text-green-600">
                                {complianceData?.total_signatures_signed || 0}/{complianceData?.total_signatures_required || 0}
                            </p>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div>
                            <p className="text-sm font-medium text-gray-700">Documents</p>
                            <p className="text-3xl font-bold mt-1">{complianceData?.documents?.length || 0}</p>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div>
                            <p className="text-sm font-medium text-gray-700">Freelancers</p>
                            <p className="text-3xl font-bold mt-1">{complianceData?.freelancers_count || 0}</p>
                        </div>
                    </Card>
                </div>

                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList className="flex flex-wrap gap-1 h-auto p-1 w-full">
                        <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                        <TabsTrigger value="documents" className="text-xs sm:text-sm">Documents</TabsTrigger>
                        <TabsTrigger value="freelancers" className="text-xs sm:text-sm">Freelancers</TabsTrigger>
                        <TabsTrigger value="management" className="text-xs sm:text-sm">Manage</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Card className="p-6">
                                <h3 className="font-semibold mb-4">Signing Progress</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value }) => `${name}: ${value}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            <Cell fill="#10b981" />
                                            <Cell fill="#f3f4f6" />
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Card>

                            <Card className="p-6">
                                <h3 className="font-semibold mb-4">Compliance by Document</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={complianceChartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                        <YAxis label={{ value: 'Compliance %', angle: -90, position: 'insideLeft' }} />
                                        <Tooltip />
                                        <Bar dataKey="compliance" fill="#3b82f6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* By Document Tab */}
                    <TabsContent value="documents" className="space-y-4">
                        {complianceData?.documents?.map(doc => (
                            <Card key={doc.id} className="p-4">
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold">{doc.title}</h4>
                                                <Badge variant="outline">{doc.type} v{doc.version}</Badge>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {doc.signed_count} of {doc.total_count} freelancers signed
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${
                                                doc.compliance_percent >= 80 ? 'text-green-600' :
                                                doc.compliance_percent >= 50 ? 'text-yellow-600' :
                                                'text-red-600'
                                            }`}>
                                                {doc.compliance_percent}%
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-600 h-2 rounded-full transition-all"
                                            style={{ width: `${doc.compliance_percent}%` }}
                                        />
                                    </div>

                                    {/* Unsigned freelancers */}
                                    {doc.unsigned_freelancers.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <p className="text-xs font-medium text-gray-600 mb-2">
                                                {doc.unsigned_freelancers.length} unsigned:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {doc.unsigned_freelancers.slice(0, 5).map(freelancer => (
                                                    <Badge key={freelancer.id} variant="secondary">
                                                        {freelancer.name}
                                                    </Badge>
                                                ))}
                                                {doc.unsigned_freelancers.length > 5 && (
                                                    <Badge variant="secondary">
                                                        +{doc.unsigned_freelancers.length - 5} more
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </TabsContent>

                    {/* By Freelancer Tab */}
                    <TabsContent value="freelancers" className="space-y-4">
                        <div className="mb-4">
                            <Input
                                placeholder="Search freelancers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {filteredFreelancers.length === 0 ? (
                            <Card className="p-8 text-center text-gray-600">
                                No freelancers found
                            </Card>
                        ) : (
                            <div className="space-y-2">
                                {filteredFreelancers.map(([name, data]) => (
                                    <Card key={name} className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-semibold">{name}</h4>
                                                <p className="text-sm text-gray-600">{data.email}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {data.signed_count}/{data.total_required} documents signed
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className={`text-lg font-bold ${
                                                        data.status === 'complete' ? 'text-green-600' :
                                                        data.status === 'in_progress' ? 'text-yellow-600' :
                                                        'text-gray-600'
                                                    }`}>
                                                        {data.compliance_percent}%
                                                    </p>
                                                </div>

                                                <Badge variant={
                                                    data.status === 'complete' ? 'default' :
                                                    data.status === 'in_progress' ? 'secondary' :
                                                    'outline'
                                                }>
                                                    {data.status === 'complete' && <CheckCircle className="w-3 h-3 mr-1" />}
                                                    {data.status === 'in_progress' && <Clock className="w-3 h-3 mr-1" />}
                                                    {data.status === 'pending' && <AlertCircle className="w-3 h-3 mr-1" />}
                                                    {data.status === 'complete' ? 'Complete' :
                                                     data.status === 'in_progress' ? 'In Progress' :
                                                     'Pending'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Management Tab */}
                    <TabsContent value="management">
                        <DocumentsManagement onDocumentDeleted={() => refetch()} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}