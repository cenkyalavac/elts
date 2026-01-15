import React, { useState, useCallback } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Upload, FileText, CheckCircle2, AlertTriangle, XCircle,
    Download, Loader2, DollarSign, Users, RefreshCw, ClipboardPaste
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function SmartcatTBMSImport() {
    const [rawInput, setRawInput] = useState('');
    const [parsedData, setParsedData] = useState(null);
    const [matchResults, setMatchResults] = useState(null);
    const [activeResultTab, setActiveResultTab] = useState("matched");

    const parseTabSeparated = (text) => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];
        
        // Parse header - detect delimiter (tab or multiple spaces)
        const headerLine = lines[0];
        const isTabSeparated = headerLine.includes('\t');
        const delimiter = isTabSeparated ? '\t' : /\s{2,}/;
        
        const headers = headerLine.split(delimiter).map(h => h.trim());
        
        // Parse rows
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(delimiter).map(v => v.trim());
            const row = {};
            headers.forEach((header, idx) => {
                row[header] = values[idx] || '';
            });
            rows.push(row);
        }
        
        return rows;
    };

    const handlePaste = useCallback(() => {
        if (!rawInput.trim()) return;
        
        setMatchResults(null);
        const data = parseTabSeparated(rawInput);
        setParsedData(data);
    }, [rawInput]);

    const handleFileUpload = useCallback((e) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;
        
        setMatchResults(null);
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result;
            setRawInput(text);
            const data = parseTabSeparated(text);
            setParsedData(data);
        };
        reader.readAsText(uploadedFile);
    }, []);

    const matchMutation = useMutation({
        mutationFn: async (data) => {
            const response = await base44.functions.invoke('smartcatPayments', {
                action: 'match_tbms_export',
                tbms_data: data
            });
            return response.data;
        },
        onSuccess: (data) => {
            setMatchResults(data);
            if (data.matched?.length > 0) setActiveResultTab("matched");
            else if (data.not_in_smartcat?.length > 0) setActiveResultTab("not_in_smartcat");
            else if (data.not_in_base44?.length > 0) setActiveResultTab("not_in_base44");
            else setActiveResultTab("unmatched");
        }
    });

    const handleMatch = () => {
        if (parsedData && parsedData.length > 0) {
            matchMutation.mutate(parsedData);
        }
    };

    const downloadCSV = (data, filename) => {
        if (!data || data.length === 0) return;
        
        const headers = Object.keys(data[0].extracted || data[0]);
        const rows = data.map(item => {
            const row = item.extracted || item;
            return headers.map(h => `"${row[h] || ''}"`).join(',');
        });
        
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Input Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Import TBMS Data
                    </CardTitle>
                    <CardDescription>
                        Paste your TBMS export data below or upload a CSV/TSV file. The system will match 
                        records against Base44 and Smartcat and highlight any mismatches.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Paste Area */}
                    <div className="space-y-2">
                        <Label>Paste TBMS Export (Tab-separated)</Label>
                        <Textarea
                            placeholder={`InvoiceCode\tResource\tStatus\tVAT\tTotalCost\tCurrency\tDateSent\tDatePaid
INV06035\tYoumna Mohammed\tDue Today\t0\t450.14\tUSD\t15/01/2026\t
INV06034\tSelim Tekin\tDue Today\t0\t178.48\tUSD\t15/01/2026\t`}
                            value={rawInput}
                            onChange={(e) => setRawInput(e.target.value)}
                            rows={8}
                            className="font-mono text-sm"
                        />
                        <div className="flex gap-2">
                            <Button onClick={handlePaste} disabled={!rawInput.trim()}>
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
                                    id="tbms-upload"
                                />
                                <label htmlFor="tbms-upload">
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

                    {/* Preview */}
                    {parsedData && parsedData.length > 0 && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="font-medium">{parsedData.length} records parsed</p>
                                    <p className="text-sm text-gray-500">
                                        Columns: {Object.keys(parsedData[0]).join(', ')}
                                    </p>
                                </div>
                                <Button 
                                    onClick={handleMatch}
                                    disabled={matchMutation.isPending}
                                >
                                    {matchMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                    )}
                                    Match & Validate
                                </Button>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <div className="overflow-x-auto max-h-64">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                {Object.keys(parsedData[0]).map(key => (
                                                    <TableHead key={key} className="text-xs whitespace-nowrap">{key}</TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {parsedData.slice(0, 5).map((row, idx) => (
                                                <TableRow key={idx}>
                                                    {Object.keys(row).map(key => (
                                                        <TableCell key={key} className="text-xs whitespace-nowrap">
                                                            {row[key]?.toString().slice(0, 30)}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                {parsedData.length > 5 && (
                                    <div className="p-2 bg-gray-50 text-center text-sm text-gray-500">
                                        +{parsedData.length - 5} more records
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Results */}
            {matchResults && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-green-50 border-green-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                                    <div>
                                        <p className="text-sm text-green-600">Fully Matched</p>
                                        <p className="text-2xl font-bold text-green-700">
                                            {matchResults.matched?.length || 0}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-yellow-50 border-yellow-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                                    <div>
                                        <p className="text-sm text-yellow-600">Not in Smartcat</p>
                                        <p className="text-2xl font-bold text-yellow-700">
                                            {matchResults.not_in_smartcat?.length || 0}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-orange-50 border-orange-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <Users className="w-8 h-8 text-orange-600" />
                                    <div>
                                        <p className="text-sm text-orange-600">Not in Base44</p>
                                        <p className="text-2xl font-bold text-orange-700">
                                            {matchResults.not_in_base44?.length || 0}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-red-50 border-red-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <XCircle className="w-8 h-8 text-red-600" />
                                    <div>
                                        <p className="text-sm text-red-600">No Match</p>
                                        <p className="text-2xl font-bold text-red-700">
                                            {matchResults.completely_unmatched?.length || 0}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Amount Summary */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-6">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Amount</p>
                                        <p className="text-xl font-bold">
                                            ${matchResults.summary?.total_amount?.toFixed(2) || '0.00'}
                                        </p>
                                    </div>
                                    <div className="h-10 w-px bg-gray-200"></div>
                                    <div>
                                        <p className="text-sm text-green-600">Matched</p>
                                        <p className="text-xl font-bold text-green-600">
                                            ${matchResults.summary?.matched_amount?.toFixed(2) || '0.00'}
                                        </p>
                                    </div>
                                    <div className="h-10 w-px bg-gray-200"></div>
                                    <div>
                                        <p className="text-sm text-red-600">Unmatched</p>
                                        <p className="text-xl font-bold text-red-600">
                                            ${matchResults.summary?.unmatched_amount?.toFixed(2) || '0.00'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detailed Results */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detailed Results</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={activeResultTab} onValueChange={setActiveResultTab}>
                                <TabsList>
                                    <TabsTrigger value="matched" className="gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        Matched ({matchResults.matched?.length || 0})
                                    </TabsTrigger>
                                    <TabsTrigger value="not_in_smartcat" className="gap-2">
                                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                        Not in Smartcat ({matchResults.not_in_smartcat?.length || 0})
                                    </TabsTrigger>
                                    <TabsTrigger value="not_in_base44" className="gap-2">
                                        <Users className="w-4 h-4 text-orange-600" />
                                        Not in Base44 ({matchResults.not_in_base44?.length || 0})
                                    </TabsTrigger>
                                    <TabsTrigger value="unmatched" className="gap-2">
                                        <XCircle className="w-4 h-4 text-red-600" />
                                        No Match ({matchResults.completely_unmatched?.length || 0})
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="matched" className="mt-4">
                                    <ResultsTable 
                                        data={matchResults.matched} 
                                        type="matched"
                                        onDownload={() => downloadCSV(matchResults.matched, 'matched_records.csv')}
                                    />
                                </TabsContent>

                                <TabsContent value="not_in_smartcat" className="mt-4">
                                    <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                                        <p className="text-sm text-yellow-800">
                                            <strong>Warning:</strong> These people exist in Base44 but are not in your Smartcat team. 
                                            You need to invite them to Smartcat before making payments.
                                        </p>
                                    </div>
                                    <ResultsTable 
                                        data={matchResults.not_in_smartcat} 
                                        type="not_in_smartcat"
                                        onDownload={() => downloadCSV(matchResults.not_in_smartcat, 'not_in_smartcat.csv')}
                                    />
                                </TabsContent>

                                <TabsContent value="not_in_base44" className="mt-4">
                                    <div className="mb-4 p-4 bg-orange-50 rounded-lg">
                                        <p className="text-sm text-orange-800">
                                            <strong>Warning:</strong> These people are in your Smartcat team but not registered in Base44. 
                                            Use "Team Sync" tab to import them into Base44.
                                        </p>
                                    </div>
                                    <ResultsTable 
                                        data={matchResults.not_in_base44} 
                                        type="not_in_base44"
                                        onDownload={() => downloadCSV(matchResults.not_in_base44, 'not_in_base44.csv')}
                                    />
                                </TabsContent>

                                <TabsContent value="unmatched" className="mt-4">
                                    <div className="mb-4 p-4 bg-red-50 rounded-lg">
                                        <p className="text-sm text-red-800">
                                            <strong>Attention:</strong> These people are neither in Base44 nor in your Smartcat team. 
                                            Check your TBMS records or add them as new freelancers.
                                        </p>
                                    </div>
                                    <ResultsTable 
                                        data={matchResults.completely_unmatched} 
                                        type="unmatched"
                                        onDownload={() => downloadCSV(matchResults.completely_unmatched, 'unmatched_records.csv')}
                                    />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}

function ResultsTable({ data, type, onDownload }) {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No records in this category
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-end mb-4">
                <Button variant="outline" size="sm" onClick={onDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Currency</TableHead>
                            <TableHead>Base44</TableHead>
                            <TableHead>Smartcat</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item, idx) => (
                            <TableRow key={idx}>
                                <TableCell className="font-mono text-sm">
                                    {item.original?.InvoiceCode || item.extracted?.invoiceCode || '-'}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {item.original?.Resource || item.extracted?.name || '-'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={
                                        (item.original?.Status || '').includes('Overdue') ? 'text-red-600 border-red-200' :
                                        (item.original?.Status || '').includes('Due Today') ? 'text-amber-600 border-amber-200' :
                                        'text-gray-600'
                                    }>
                                        {item.original?.Status || '-'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                    {parseFloat(item.original?.TotalCost || item.extracted?.amount || 0).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    {item.original?.Currency || item.extracted?.currency || 'USD'}
                                </TableCell>
                                <TableCell>
                                    {item.base44_freelancer ? (
                                        <Link 
                                            to={createPageUrl(`FreelancerDetail?id=${item.base44_freelancer.id}`)}
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            ✓ {item.base44_freelancer.name?.split(' ')[0]}
                                        </Link>
                                    ) : (
                                        <Badge variant="outline" className="text-red-600">Missing</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {item.smartcat_user ? (
                                        <Badge className="bg-green-100 text-green-700">
                                            ✓ Found
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-red-600">Missing</Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}