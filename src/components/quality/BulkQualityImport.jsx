import React, { useState, useCallback } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { 
    Upload, CheckCircle2, AlertTriangle, Loader2, FileText, 
    ClipboardPaste, Download
} from "lucide-react";

export default function BulkQualityImport({ freelancers, onComplete }) {
    const [rawInput, setRawInput] = useState('');
    const [parsedData, setParsedData] = useState([]);
    const [importResults, setImportResults] = useState(null);

    const parseInput = useCallback(() => {
        const lines = rawInput.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            setParsedData([]);
            return;
        }

        const headerLine = lines[0];
        const isTabSeparated = headerLine.includes('\t');
        const delimiter = isTabSeparated ? '\t' : ',';
        
        const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));
        
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
            const row = {};
            headers.forEach((header, idx) => {
                row[header] = values[idx] || '';
            });
            
            // Try to match freelancer
            const freelancerName = row.freelancer || row.translator || row.name || row.resource || '';
            const freelancerEmail = row.email || row.freelancer_email || '';
            
            let matchedFreelancer = null;
            if (freelancerEmail) {
                matchedFreelancer = freelancers.find(f => 
                    f.email?.toLowerCase() === freelancerEmail.toLowerCase()
                );
            }
            if (!matchedFreelancer && freelancerName) {
                matchedFreelancer = freelancers.find(f => 
                    f.full_name?.toLowerCase() === freelancerName.toLowerCase()
                );
            }

            rows.push({
                raw: row,
                freelancer_id: matchedFreelancer?.id || null,
                freelancer_name: matchedFreelancer?.full_name || freelancerName,
                matched: !!matchedFreelancer,
                report_type: (row.type || row.report_type || 'QS').toUpperCase().includes('LQA') ? 'LQA' : 'QS',
                lqa_score: parseFloat(row.lqa_score || row.lqa || '') || null,
                qs_score: parseFloat(row.qs_score || row.qs || row.score || '') || null,
                project_name: row.project || row.project_name || row.job || '',
                client_account: row.client || row.client_account || row.account || '',
                source_language: row.source || row.source_language || row.src || '',
                target_language: row.target || row.target_language || row.tgt || '',
                content_type: row.content_type || row.content || row.domain || '',
                job_type: row.job_type || row.task || '',
                report_date: row.date || row.report_date || new Date().toISOString().split('T')[0],
                reviewer_comments: row.comments || row.notes || row.feedback || ''
            });
        }
        
        setParsedData(rows);
    }, [rawInput, freelancers]);

    const importMutation = useMutation({
        mutationFn: async (records) => {
            const results = { success: 0, failed: 0, errors: [] };
            
            for (const record of records) {
                if (!record.freelancer_id) {
                    results.failed++;
                    results.errors.push(`${record.freelancer_name}: No matching freelancer found`);
                    continue;
                }

                const reportData = {
                    freelancer_id: record.freelancer_id,
                    report_type: record.report_type,
                    lqa_score: record.lqa_score,
                    qs_score: record.qs_score,
                    project_name: record.project_name,
                    client_account: record.client_account,
                    source_language: record.source_language,
                    target_language: record.target_language,
                    content_type: record.content_type,
                    job_type: record.job_type,
                    report_date: record.report_date,
                    reviewer_comments: record.reviewer_comments,
                    status: 'finalized',
                    imported: true
                };

                await base44.entities.QualityReport.create(reportData);
                results.success++;
            }
            
            return results;
        },
        onSuccess: (results) => {
            setImportResults(results);
        }
    });

    const handleImport = () => {
        const validRecords = parsedData.filter(r => r.matched && (r.lqa_score || r.qs_score));
        importMutation.mutate(validRecords);
    };

    const downloadTemplate = () => {
        const template = `freelancer,type,lqa_score,qs_score,project,client,source,target,content_type,job_type,date,comments
John Doe,LQA,85.5,,Project Alpha,Amazon,EN,TR,Marketing,Translation,2024-01-15,Good work
Jane Smith,QS,,4.5,Project Beta,AppleCare,EN,TR,Technical,Review,2024-01-16,Minor issues`;
        
        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'quality_import_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const matchedCount = parsedData.filter(r => r.matched).length;
    const withScoreCount = parsedData.filter(r => r.lqa_score || r.qs_score).length;

    return (
        <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">Import Instructions</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Paste CSV or tab-separated data with headers</li>
                    <li>• Required columns: freelancer (name or email), score (lqa_score or qs_score)</li>
                    <li>• Optional: type, project, client, source, target, date, comments</li>
                    <li>• Freelancers are matched by email first, then by exact name</li>
                </ul>
                <Button variant="outline" size="sm" className="mt-3" onClick={downloadTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                </Button>
            </div>

            {/* Input Area */}
            <div className="space-y-2">
                <Label>Paste Data (CSV or Tab-separated)</Label>
                <Textarea
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    placeholder={`freelancer,type,lqa_score,qs_score,project,date
John Doe,LQA,85.5,,Project Alpha,2024-01-15
Jane Smith,QS,,4.5,Project Beta,2024-01-16`}
                    rows={8}
                    className="font-mono text-sm"
                />
                <Button onClick={parseInput} disabled={!rawInput.trim()}>
                    <ClipboardPaste className="w-4 h-4 mr-2" />
                    Parse Data
                </Button>
            </div>

            {/* Preview */}
            {parsedData.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-4">
                            <Badge variant="outline">
                                {parsedData.length} records
                            </Badge>
                            <Badge className={matchedCount === parsedData.length ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                {matchedCount} matched
                            </Badge>
                            <Badge className={withScoreCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}>
                                {withScoreCount} with scores
                            </Badge>
                        </div>
                        <Button 
                            onClick={handleImport}
                            disabled={importMutation.isPending || matchedCount === 0}
                        >
                            {importMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4 mr-2" />
                            )}
                            Import {matchedCount} Records
                        </Button>
                    </div>

                    <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Freelancer</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>LQA</TableHead>
                                    <TableHead>QS</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {parsedData.map((row, idx) => (
                                    <TableRow key={idx} className={!row.matched ? 'bg-red-50' : ''}>
                                        <TableCell>
                                            {row.matched ? (
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {row.freelancer_name}
                                            {!row.matched && (
                                                <span className="text-xs text-red-500 block">Not found</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{row.report_type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {row.lqa_score ? (
                                                <span className={
                                                    row.lqa_score >= 90 ? 'text-green-600' :
                                                    row.lqa_score >= 70 ? 'text-yellow-600' : 'text-red-600'
                                                }>
                                                    {row.lqa_score}
                                                </span>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>{row.qs_score || '-'}</TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {row.project_name || '-'}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-500">
                                            {row.report_date}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* Results */}
            {importResults && (
                <div className={`p-4 rounded-lg ${importResults.failed > 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        <div>
                            <p className="font-medium">Import Complete</p>
                            <p className="text-sm text-gray-600">
                                {importResults.success} imported successfully
                                {importResults.failed > 0 && `, ${importResults.failed} failed`}
                            </p>
                        </div>
                    </div>
                    {importResults.errors.length > 0 && (
                        <div className="mt-3 text-sm text-red-600">
                            {importResults.errors.slice(0, 5).map((err, i) => (
                                <p key={i}>• {err}</p>
                            ))}
                        </div>
                    )}
                    <Button className="mt-4" onClick={onComplete}>
                        Done
                    </Button>
                </div>
            )}
        </div>
    );
}