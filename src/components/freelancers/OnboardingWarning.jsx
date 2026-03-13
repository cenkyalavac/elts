import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function OnboardingWarning({ freelancer }) {
    if (!freelancer || freelancer.status !== 'Approved') return null;

    const checks = [
        { label: 'CV Uploaded', done: !!freelancer.cv_file_url },
        { label: 'NDA Signed', done: !!freelancer.nda },
        { label: 'Smartcat ID', done: !!freelancer.smartcat_supplier_id },
        { label: 'Language Pairs', done: freelancer.language_pairs?.length > 0 },
        { label: 'Rates Set', done: freelancer.rates?.length > 0 },
    ];

    const incomplete = checks.filter(c => !c.done);
    if (incomplete.length === 0) return null;

    return (
        <Card className="border-amber-300 bg-amber-50">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-amber-800 text-sm">Onboarding Incomplete</h4>
                        <p className="text-xs text-amber-700 mt-1">
                            This freelancer is approved but hasn't completed all onboarding steps:
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {checks.map(c => (
                                <span key={c.label} className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-full ${
                                    c.done ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {c.done ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                    {c.label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}