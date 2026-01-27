import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPageUrl } from "../utils";

export default function ImportFreelancersPage() {
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const [dropboxPath, setDropboxPath] = useState('');
    const [isImportingFromDropbox, setIsImportingFromDropbox] = useState(false);
    
    const queryClient = useQueryClient();

    // Security: Authentication and role check
    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const isAuth = await base44.auth.isAuthenticated();
            if (!isAuth) {
                base44.auth.redirectToLogin(createPageUrl('ImportFreelancers'));
                return null;
            }
            return base44.auth.me();
        },
    });

    const isAdmin = user?.role === 'admin';

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

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                <div className="max-w-4xl mx-auto text-center mt-20">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    <p className="text-gray-600">Only administrators can import freelancers.</p>
                </div>
            </div>
        );
    }

    const importMutation = useMutation({
        mutationFn: async (csvData) => {
            const response = await base44.functions.invoke('importFreelancers', { csvData });
            return response.data;
        },
        onSuccess: (data) => {
            setResult(data);
            queryClient.invalidateQueries({ queryKey: ['freelancers'] });
        },
        onError: (error) => {
            setResult({
                success: false,
                error: error.message || 'Import failed'
            });
        }
    });

    const dropboxImportMutation = useMutation({
        mutationFn: async (folderPath) => {
            const response = await base44.functions.invoke('importFromDropbox', { folder_path: folderPath });
            return response.data;
        },
        onSuccess: (data) => {
            setResult(data);
            setIsImportingFromDropbox(false);
            queryClient.invalidateQueries({ queryKey: ['freelancers'] });
        },
        onError: (error) => {
            setResult({ 
                success: false, 
                error: error.response?.data?.error || error.message 
            });
            setIsImportingFromDropbox(false);
        }
    });

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResult(null);
        }
    };

    const parseCSV = (text) => {
        // Remove BOM if present
        text = text.replace(/^\uFEFF/, '');
        
        const lines = text.split(/\r?\n/);
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').replace(/^ï»¿/, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = [];
            let current = '';
            let inQuotes = false;

            for (let j = 0; j < lines[i].length; j++) {
                const char = lines[i][j];
                
                if (char === '"' && (j === 0 || lines[i][j-1] !== '\\')) {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim().replace(/^"|"$/g, ''));
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim().replace(/^"|"$/g, ''));

            if (values.length > 0 && values.some(v => v !== '')) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }
        }

        console.log('Parsed CSV rows:', data.length);
        console.log('Headers:', headers);
        return data;
    };

    const handleImport = async () => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target.result;
                const csvData = parseCSV(text);
                await importMutation.mutateAsync(csvData);
            } catch (error) {
                setResult({ 
                    success: false, 
                    error: error.message 
                });
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Import Freelancers from CSV
                </h1>

                <Card>
                    <CardHeader>
                        <CardTitle>Upload CSV File</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <input
                                type="file"
                                accept=".csv,.txt"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-lg file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-blue-50 file:text-blue-700
                                    hover:file:bg-blue-100"
                            />
                            {file && (
                                <p className="mt-2 text-sm text-gray-600">
                                    Selected: {file.name}
                                </p>
                            )}
                        </div>

                        <Button
                            onClick={handleImport}
                            disabled={!file || importMutation.isPending}
                            className="w-full"
                        >
                            {importMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Import Freelancers
                                </>
                            )}
                        </Button>

                        {result && (
                            <div className="space-y-4">
                                {result.success ? (
                                    <Alert className="border-green-200 bg-green-50">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <AlertDescription className="text-green-800">
                                            <div className="font-semibold">Import Successful!</div>
                                            <div className="mt-2">
                                                <p>Imported: {result.imported} freelancers</p>
                                                {result.errors > 0 && (
                                                    <p className="text-orange-600">
                                                        Errors: {result.errors}
                                                    </p>
                                                )}
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <Alert className="border-red-200 bg-red-50">
                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                        <AlertDescription className="text-red-800">
                                            <div className="font-semibold">Import Failed</div>
                                            <div className="mt-2">{result.error}</div>
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {result.details?.imported?.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Imported:</h3>
                                        <div className="max-h-40 overflow-y-auto text-sm space-y-1">
                                            {result.details.imported.map((name, idx) => (
                                                <div key={idx} className="text-gray-700">
                                                    ✓ {name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {result.details?.errors?.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold mb-2 text-red-600">Errors:</h3>
                                        <div className="max-h-40 overflow-y-auto text-sm space-y-1">
                                            {result.details.errors.map((err, idx) => (
                                                <div key={idx} className="text-red-700">
                                                    ✗ {err.row}: {err.error}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Dropbox Import */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="w-5 h-5" />
                            Dropbox'tan İçe Aktar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="dropbox-path">Dropbox Klasör Yolu</Label>
                            <Input
                                id="dropbox-path"
                                placeholder="/Freelancers/CVs"
                                value={dropboxPath}
                                onChange={(e) => setDropboxPath(e.target.value)}
                                disabled={isImportingFromDropbox}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Örnek: /Freelancers veya /CVs/2024
                            </p>
                        </div>
                        <Button
                            onClick={() => {
                                setIsImportingFromDropbox(true);
                                setResult(null);
                                dropboxImportMutation.mutate(dropboxPath);
                            }}
                            disabled={!dropboxPath || isImportingFromDropbox}
                            className="w-full"
                        >
                            {isImportingFromDropbox ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    İçe Aktarılıyor...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Dropbox'tan İçe Aktar
                                </>
                            )}
                        </Button>
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Bu işlem belirtilen klasördeki ve alt klasörlerdeki tüm PDF, DOC ve DOCX dosyalarını tarayacak ve sisteme aktaracaktır.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Instructions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-gray-600">
                        <p>1. Upload your CSV file containing freelancer data</p>
                        <p>2. The system will automatically parse and import the data</p>
                        <p>3. Existing freelancers (matched by email) will be updated</p>
                        <p>4. New freelancers will be created</p>
                        <p className="mt-4 text-xs text-gray-500">
                            Expected columns: ResourceFirstName, ResourceLastName, Email, Phone1, 
                            Country, NativeLanguage, Software, Categories, ServiceData, Status, etc.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}