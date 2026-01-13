import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import DocumentSigningCard from './DocumentSigningCard';

export default function FreelancerDocumentsList({ freelancerId }) {
    const { data: documents = [], isLoading: docsLoading, refetch: refetchDocs } = useQuery({
        queryKey: ['documents-freelancer', freelancerId],
        queryFn: async () => {
            const response = await base44.functions.invoke('listDocuments', {});
            return response.data.documents;
        }
    });

    const { data: signatures = [], isLoading: sigsLoading, refetch: refetchSigs } = useQuery({
        queryKey: ['document-signatures', freelancerId],
        queryFn: async () => {
            const response = await base44.functions.invoke('getFreelancerSignatures', {
                freelancer_id: freelancerId
            });
            return response.data.signatures;
        }
    });

    const isLoading = docsLoading || sigsLoading;

    if (isLoading) {
        return (
            <Card className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Loading documents...</p>
            </Card>
        );
    }

    if (documents.length === 0) {
        return (
            <Card className="p-8 text-center text-gray-600">
                No documents required at this time
            </Card>
        );
    }

    const handleSigned = () => {
        refetchSigs();
    };

    return (
        <div className="space-y-3">
            {documents.map(doc => {
                const signature = signatures.find(s => s.document_id === doc.id);
                return (
                    <DocumentSigningCard
                        key={doc.id}
                        document={doc}
                        signature={signature}
                        freelancerId={freelancerId}
                        onSigned={handleSigned}
                    />
                );
            })}
        </div>
    );
}