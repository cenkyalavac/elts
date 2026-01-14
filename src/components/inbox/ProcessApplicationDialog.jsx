import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ProcessApplicationDialog({ email, open, onOpenChange, onSuccess }) {
    const [extractedData, setExtractedData] = useState(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [showReview, setShowReview] = useState(false);

    // Don't render if no email
    if (!email) {
        return null;
    }

    const processMutation = useMutation({
        mutationFn: async () => {
            setIsExtracting(true);
            try {
                const response = await base44.functions.invoke('processEmailAsApplication', {
                    email: email
                });
                if (response.data.success) {
                    setExtractedData(response.data.extracted_data);
                    setShowReview(true);
                }
                return response.data;
            } finally {
                setIsExtracting(false);
            }
        },
        onError: (error) => {
            const errorMsg = error.response?.data?.error || 'Failed to process email';
            const errorCode = error.response?.data?.code;
            
            let userMessage = errorMsg;
            if (errorCode === 'DUPLICATE_EMAIL') {
                userMessage = 'This email address is already registered in the system.';
            } else if (errorCode === 'GMAIL_NOT_CONNECTED') {
                userMessage = 'Gmail is not connected. Please reconnect your Gmail account.';
            }
            
            toast.error(userMessage);
        },
        onSuccess: (data) => {
            if (data.success) {
                toast.success(`Application created for ${data.freelancer.full_name}`);
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(data.error || 'Failed to create application');
            }
        }
    });

    const handleConfirm = async () => {
        // Submit with confirmed data
        await processMutation.mutateAsync();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Process as Application</DialogTitle>
                    <DialogDescription>
                        Extract applicant data from this email and create a freelancer record
                    </DialogDescription>
                </DialogHeader>

                {!showReview ? (
                    // Initial state - extraction in progress
                    <div className="space-y-4 py-4">
                        <Card className="p-4 bg-blue-50 border-blue-200">
                            <div className="space-y-2">
                                <h4 className="font-semibold text-blue-900">Email Details</h4>
                                <div className="text-sm text-blue-800">
                                    <p><strong>From:</strong> {email.from}</p>
                                    <p><strong>Subject:</strong> {email.subject}</p>
                                    <p><strong>Date:</strong> {email.date}</p>
                                    {email.attachments?.length > 0 && (
                                        <p><strong>Attachments:</strong> {email.attachments.length}</p>
                                    )}
                                </div>
                            </div>
                        </Card>

                        <div className="flex gap-2">
                            <Button
                                onClick={() => processMutation.mutate()}
                                disabled={isExtracting || processMutation.isPending}
                                className="flex-1"
                            >
                                {isExtracting || processMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Extracting Data...
                                    </>
                                ) : (
                                    'Extract & Review'
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isExtracting || processMutation.isPending}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Review state - show extracted data
                    <div className="space-y-4 py-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-green-900">Data Extracted Successfully</h4>
                                <p className="text-sm text-green-800">Review the extracted information below. Click "Confirm" to create the freelancer record.</p>
                            </div>
                        </div>

                        {/* AI Summary & Insights */}
                        {extractedData?.summary && (
                            <Card className="p-4 bg-blue-50 border-blue-200">
                                <h4 className="font-semibold text-blue-900 mb-2">Profile Summary</h4>
                                <p className="text-sm text-blue-800">{extractedData.summary}</p>
                            </Card>
                        )}

                        {extractedData?.key_skills?.length > 0 && (
                            <Card className="p-4 bg-amber-50 border-amber-200">
                                <h4 className="font-semibold text-amber-900 mb-2">Key Skills Identified</h4>
                                <div className="flex flex-wrap gap-2">
                                    {extractedData.key_skills.map((skill, idx) => (
                                        <span key={idx} className="inline-block bg-amber-200 text-amber-900 px-3 py-1 rounded-full text-sm font-medium">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {extractedData?.suggested_roles?.length > 0 && (
                            <Card className="p-4 bg-purple-50 border-purple-200">
                                <h4 className="font-semibold text-purple-900 mb-2">Suggested Job Roles</h4>
                                <div className="space-y-2">
                                    {extractedData.suggested_roles.map((role, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm text-purple-800">
                                            <div className="w-2 h-2 bg-purple-600 rounded-full" />
                                            {role}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {extractedData?.full_name && (
                                <Card className="p-3 space-y-1">
                                    <label className="text-xs font-semibold text-gray-600">Full Name</label>
                                    <p className="text-sm text-gray-900">{extractedData.full_name}</p>
                                </Card>
                            )}

                            {extractedData?.email && (
                                <Card className="p-3 space-y-1">
                                    <label className="text-xs font-semibold text-gray-600">Email</label>
                                    <p className="text-sm text-gray-900">{extractedData.email}</p>
                                </Card>
                            )}

                            {extractedData?.phone && (
                                <Card className="p-3 space-y-1">
                                    <label className="text-xs font-semibold text-gray-600">Phone</label>
                                    <p className="text-sm text-gray-900">{extractedData.phone}</p>
                                </Card>
                            )}

                            {extractedData?.location && (
                                <Card className="p-3 space-y-1">
                                    <label className="text-xs font-semibold text-gray-600">Location</label>
                                    <p className="text-sm text-gray-900">{extractedData.location}</p>
                                </Card>
                            )}

                            {extractedData?.native_language && (
                                <Card className="p-3 space-y-1">
                                    <label className="text-xs font-semibold text-gray-600">Native Language</label>
                                    <p className="text-sm text-gray-900">{extractedData.native_language}</p>
                                </Card>
                            )}

                            {extractedData?.language_pairs?.length > 0 && (
                                <Card className="p-3 space-y-2">
                                    <label className="text-xs font-semibold text-gray-600">Language Pairs</label>
                                    <div className="space-y-1">
                                        {extractedData.language_pairs.map((pair, idx) => (
                                            <div key={idx} className="text-sm text-gray-900">
                                                {pair.source_language} → {pair.target_language} ({pair.proficiency})
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {extractedData?.experience_years && (
                                <Card className="p-3 space-y-1">
                                    <label className="text-xs font-semibold text-gray-600">Experience</label>
                                    <p className="text-sm text-gray-900">{extractedData.experience_years} years</p>
                                </Card>
                            )}

                            {extractedData?.specializations?.length > 0 && (
                                <Card className="p-3 space-y-2">
                                    <label className="text-xs font-semibold text-gray-600">Specializations</label>
                                    <div className="flex flex-wrap gap-1">
                                        {extractedData.specializations.map((spec, idx) => (
                                            <span key={idx} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                                {spec}
                                            </span>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {extractedData?.service_types?.length > 0 && (
                                <Card className="p-3 space-y-2">
                                    <label className="text-xs font-semibold text-gray-600">Service Types</label>
                                    <div className="flex flex-wrap gap-1">
                                        {extractedData.service_types.map((service, idx) => (
                                            <span key={idx} className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                                                {service}
                                            </span>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {extractedData?.skills?.length > 0 && (
                                <Card className="p-3 space-y-2">
                                    <label className="text-xs font-semibold text-gray-600">Skills</label>
                                    <div className="flex flex-wrap gap-1">
                                        {extractedData.skills.map((skill, idx) => (
                                            <span key={idx} className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {extractedData?.rates?.length > 0 && (
                                <Card className="p-3 space-y-2">
                                    <label className="text-xs font-semibold text-gray-600">Rates</label>
                                    <div className="space-y-1">
                                        {extractedData.rates.map((rate, idx) => (
                                            <div key={idx} className="text-sm text-gray-900">
                                                {rate.source_language} → {rate.target_language}: {rate.rate_value} {rate.currency}/{rate.rate_type}
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {extractedData?.notes && (
                                <Card className="p-3 space-y-1">
                                    <label className="text-xs font-semibold text-gray-600">Notes</label>
                                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{extractedData.notes}</p>
                                </Card>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowReview(false)}
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                disabled={processMutation.isPending}
                            >
                                {processMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Confirm & Create'
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}