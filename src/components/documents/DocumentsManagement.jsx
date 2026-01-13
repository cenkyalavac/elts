import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentsManagement({ onDocumentDeleted }) {
    const [selectedDoc, setSelectedDoc] = useState(null);

    const { data: documents = [], refetch } = useQuery({
        queryKey: ['documents'],
        queryFn: async () => {
            const response = await base44.functions.invoke('listDocuments', {});
            return response.data.documents;
        }
    });

    const handleDelete = async (docId) => {
        if (confirm('Are you sure you want to delete this document?')) {
            try {
                await base44.functions.invoke('deleteDocument', { document_id: docId });
                toast.success('Document deleted');
                refetch();
                onDocumentDeleted?.();
            } catch (error) {
                toast.error('Failed to delete document');
            }
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Active Documents</h3>
                <span className="text-sm text-gray-600">{documents.length} document(s)</span>
            </div>

            {documents.length === 0 ? (
                <Card className="p-6 text-center text-gray-600">
                    No documents yet
                </Card>
            ) : (
                <div className="space-y-2">
                    {documents.map(doc => (
                        <Card key={doc.id} className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                    <FileText className="w-5 h-5 text-gray-600 mt-1" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-gray-900">{doc.title}</h4>
                                            <Badge variant="outline">{doc.type}</Badge>
                                            {doc.required_for_approval && (
                                                <Badge className="bg-red-100 text-red-800">Required</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">{doc.description}</p>
                                        <p className="text-xs text-gray-500 mt-1">v{doc.version}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 ml-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(doc.file_url, '_blank')}
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(doc.id)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}