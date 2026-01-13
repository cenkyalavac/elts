import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function NormalizeLanguagesPage() {
    const [status, setStatus] = useState('idle');
    const [result, setResult] = useState(null);

    const runNormalization = async () => {
        setStatus('loading');
        try {
            const response = await base44.functions.invoke('normalizeLanguagePairs', {});
            setResult(response.data);
            setStatus('success');
        } catch (error) {
            setResult({ error: error.message });
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Normalize Language Pairs to ISO 639-1 Codes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-gray-600">
                            This will convert all language pair names (e.g., "English", "German") to ISO 639-1 codes (e.g., "en", "de").
                        </p>

                        <Button 
                            onClick={runNormalization}
                            disabled={status === 'loading'}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {status === 'loading' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Run Normalization
                        </Button>

                        {status === 'success' && result && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-semibold text-green-900">Success!</div>
                                    <div className="text-sm text-green-700 mt-1">
                                        Total freelancers: {result.totalFreelancers}<br />
                                        Updated: {result.updatedCount}
                                    </div>
                                </div>
                            </div>
                        )}

                        {status === 'error' && result && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-semibold text-red-900">Error</div>
                                    <div className="text-sm text-red-700 mt-1">{result.error}</div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}