import React, { useState, useCallback } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Upload, FileText, CheckCircle2, AlertTriangle, XCircle,
    Download, Loader2, DollarSign, Users, RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function SmartcatTBMSImport() {
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [matchResults, setMatchResults] = useState(null);
    const [activeResultTab, setActiveResultTab] = useState("matched");

    const parseCSV = (text) => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];
        
        // Detect delimiter
        const delimiter = lines[0].includes(';') ? ';' : ',';
        
        // Parse header
        const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
        
        // Parse rows
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
            const row = {};
            headers.forEach((header, idx) => {
                row[header] = values[idx] || '';
            });
            rows.push(row);
        }
        
        return rows;
    };

    const handleFileUpload = useCallback((e) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;
        
        setFile(uploadedFile);
        setMatchResults(null);
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result;
            const data = parseCSV(text);
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
            // Set initial tab based on results
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
            {/* Upload Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        TBMS Export Yükle
                    </CardTitle>
                    <CardDescription>
                        TBMS'ten aldığınız CSV dosyasını yükleyin. Sistem otomatik olarak Base44 ve Smartcat'teki 
                        kayıtlarla eşleştirecek ve uyumsuzlukları raporlayacak.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <input
                            type="file"
                            accept=".csv,.txt"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="tbms-upload"
                        />
                        <label htmlFor="tbms-upload" className="cursor-pointer">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-gray-700">
                                {file ? file.name : 'CSV dosyasını sürükleyin veya tıklayın'}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Desteklenen formatlar: CSV, TXT (virgül veya noktalı virgül ayraçlı)
                            </p>
                        </label>
                    </div>

                    {parsedData && parsedData.length > 0 && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="font-medium">{parsedData.length} kayıt bulundu</p>
                                    <p className="text-sm text-gray-500">
                                        Alanlar: {Object.keys(parsedData[0]).slice(0, 5).join(', ')}...
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
                                    Eşleştir ve Kontrol Et
                                </Button>
                            </div>

                            {/* Preview */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="overflow-x-auto max-h-64">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                {Object.keys(parsedData[0]).slice(0, 6).map(key => (
                                                    <TableHead key={key} className="text-xs">{key}</TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {parsedData.slice(0, 5).map((row, idx) => (
                                                <TableRow key={idx}>
                                                    {Object.keys(row).slice(0, 6).map(key => (
                                                        <TableCell key={key} className="text-xs">
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
                                        +{parsedData.length - 5} daha fazla kayıt
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
                                        <p className="text-sm text-green-600">Tam Eşleşme</p>
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
                                        <p className="text-sm text-yellow-600">Smartcat'te Yok</p>
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
                                        <p className="text-sm text-orange-600">Base44'te Yok</p>
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
                                        <p className="text-sm text-red-600">Hiç Eşleşmedi</p>
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
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div>
                                        <p className="text-sm text-gray-600">Toplam Tutar</p>
                                        <p className="text-xl font-bold">
                                            ${matchResults.summary?.total_amount?.toFixed(2) || '0.00'}
                                        </p>
                                    </div>
                                    <div className="h-10 w-px bg-gray-200"></div>
                                    <div>
                                        <p className="text-sm text-green-600">Eşleşen</p>
                                        <p className="text-xl font-bold text-green-600">
                                            ${matchResults.summary?.matched_amount?.toFixed(2) || '0.00'}
                                        </p>
                                    </div>
                                    <div className="h-10 w-px bg-gray-200"></div>
                                    <div>
                                        <p className="text-sm text-red-600">Eşleşmeyen</p>
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
                            <CardTitle>Detaylı Sonuçlar</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={activeResultTab} onValueChange={setActiveResultTab}>
                                <TabsList>
                                    <TabsTrigger value="matched" className="gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        Eşleşen ({matchResults.matched?.length || 0})
                                    </TabsTrigger>
                                    <TabsTrigger value="not_in_smartcat" className="gap-2">
                                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                        Smartcat'te Yok ({matchResults.not_in_smartcat?.length || 0})
                                    </TabsTrigger>
                                    <TabsTrigger value="not_in_base44" className="gap-2">
                                        <Users className="w-4 h-4 text-orange-600" />
                                        Base44'te Yok ({matchResults.not_in_base44?.length || 0})
                                    </TabsTrigger>
                                    <TabsTrigger value="unmatched" className="gap-2">
                                        <XCircle className="w-4 h-4 text-red-600" />
                                        Hiç Eşleşmedi ({matchResults.completely_unmatched?.length || 0})
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
                                            <strong>Uyarı:</strong> Bu kişiler Base44'te kayıtlı ama Smartcat ekibinizde değil. 
                                            Ödeme yapabilmek için önce Smartcat'e davet etmeniz gerekiyor.
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
                                            <strong>Uyarı:</strong> Bu kişiler Smartcat ekibinizde var ama Base44'te kayıtlı değil. 
                                            "Ekip Senkronizasyonu" sekmesinden Base44'e aktarabilirsiniz.
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
                                            <strong>Dikkat:</strong> Bu kişiler ne Base44'te ne de Smartcat ekibinizde bulunuyor. 
                                            TBMS'teki kayıtları kontrol edin veya yeni freelancer olarak ekleyin.
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
                Bu kategoride kayıt yok
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-end mb-4">
                <Button variant="outline" size="sm" onClick={onDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    CSV İndir
                </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>İsim</TableHead>
                            <TableHead>E-posta</TableHead>
                            <TableHead>Proje</TableHead>
                            <TableHead className="text-right">Tutar</TableHead>
                            <TableHead>Base44</TableHead>
                            <TableHead>Smartcat</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item, idx) => (
                            <TableRow key={idx}>
                                <TableCell className="font-medium">
                                    {item.extracted?.name || '-'}
                                </TableCell>
                                <TableCell>{item.extracted?.email || '-'}</TableCell>
                                <TableCell className="text-sm text-gray-600">
                                    {item.extracted?.projectName?.slice(0, 30) || '-'}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                    ${parseFloat(item.extracted?.amount || 0).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    {item.base44_freelancer ? (
                                        <Link 
                                            to={createPageUrl(`FreelancerDetail?id=${item.base44_freelancer.id}`)}
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            {item.base44_freelancer.name}
                                        </Link>
                                    ) : (
                                        <Badge variant="outline" className="text-red-600">Yok</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {item.smartcat_user ? (
                                        <Badge className="bg-green-100 text-green-700">
                                            {item.smartcat_user.name?.slice(0, 20)}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-red-600">Yok</Badge>
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