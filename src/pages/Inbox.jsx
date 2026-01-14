import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    Mail, FileText, Clock, ChevronDown, ChevronUp, 
    Loader2, RefreshCw, LinkIcon, CheckCircle, AlertCircle 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import ProcessApplicationDialog from '@/components/inbox/ProcessApplicationDialog';
import EmailAnalysis from '@/components/inbox/EmailAnalysis';

export default function InboxPage() {
    const [expandedEmail, setExpandedEmail] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [maxResults, setMaxResults] = useState(30);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [emailAnalysis, setEmailAnalysis] = useState({});
    const queryClient = useQueryClient();

    // Fetch current user
    const { data: user, isLoading: userLoading, error: userError } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            try {
                return await base44.auth.me();
            } catch (e) {
                console.error('Auth error:', e);
                return null;
            }
        },
    });

    // Gmail connect mutation
    const connectMutation = useMutation({
        mutationFn: async () => {
            const response = await base44.functions.invoke('connectGmail', {});
            return response.data;
        },
        onSuccess: (data) => {
            if (data.authUrl) {
                window.location.href = data.authUrl;
            }
        },
        onError: (error) => {
            toast.error('Gmail bağlantısı başlatılamadı');
            console.error('Connect error:', error);
        }
    });

    // Fetch emails - only when connected
    const { 
        data: emailData = { emails: [] }, 
        isLoading: emailsLoading, 
        error: emailsError, 
        refetch 
    } = useQuery({
        queryKey: ['allEmails', maxResults],
        queryFn: async () => {
            const response = await base44.functions.invoke('getGmailEmails', {
                maxResults: maxResults
            });
            return { emails: response.data?.emails || [] };
        },
        enabled: !!user && user.role === 'admin' && !!user.gmailRefreshToken,
        retry: 1,
    });

    // Analyze email mutation
    const analyzeEmailMutation = useMutation({
        mutationFn: async (email) => {
            const response = await base44.functions.invoke('analyzeEmailWithAI', {
                email: {
                    subject: email.subject,
                    from: email.from,
                    body: email.body || email.snippet,
                    attachments: email.attachments
                }
            });
            return response.data.analysis;
        },
        onSuccess: (data, variables) => {
            setEmailAnalysis(prev => ({
                ...prev,
                [variables.id]: data
            }));
        }
    });

    const handleProcessEmail = (email) => {
        setSelectedEmail(email);
        setDialogOpen(true);
    };

    const formatEmailDate = (dateStr) => {
        try {
            return format(parseISO(dateStr), 'MMM d, yyyy HH:mm');
        } catch {
            return dateStr;
        }
    };

    const extractEmailAddress = (fromString) => {
        const match = fromString?.match(/<(.+?)>/);
        return match ? match[1] : fromString;
    };

    const filteredEmails = emailData.emails.filter(email => {
        const searchTerm = searchQuery.toLowerCase();
        return (
            email.subject?.toLowerCase().includes(searchTerm) ||
            email.from?.toLowerCase().includes(searchTerm)
        );
    });

    // Loading state
    if (userLoading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-6xl mx-auto">
                    <Card className="p-8 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                        <p className="text-gray-600">Yükleniyor...</p>
                    </Card>
                </div>
            </div>
        );
    }

    // Not logged in
    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-6xl mx-auto">
                    <Card className="p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900">Giriş Gerekli</h2>
                        <p className="text-gray-600 mt-2">Bu sayfayı görüntülemek için giriş yapmalısınız.</p>
                    </Card>
                </div>
            </div>
        );
    }

    // Access denied for non-admins
    if (user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-6xl mx-auto">
                    <Card className="p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900">Erişim Reddedildi</h2>
                        <p className="text-gray-600 mt-2">Gelen kutusuna yalnızca yöneticiler erişebilir.</p>
                    </Card>
                </div>
            </div>
        );
    }

    const isConnected = !!user?.gmailRefreshToken;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Gelen Kutusu</h1>
                        <p className="text-gray-600 mt-1">Gmail e-postalarınızı görüntüleyin ve yönetin</p>
                    </div>
                    {isConnected && (
                        <Button
                            onClick={() => refetch()}
                            disabled={emailsLoading}
                            className="gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${emailsLoading ? 'animate-spin' : ''}`} />
                            Yenile
                        </Button>
                    )}
                </div>

                {/* Gmail Connection Status Card */}
                <Card className="mb-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Mail className="w-5 h-5" />
                            Gmail Entegrasyonu
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isConnected ? (
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <div>
                                    <div className="font-medium text-green-800">Bağlı</div>
                                    <div className="text-sm text-gray-600">{user.email}</div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Gelen kutunuzdaki e-postaları görüntülemek için Gmail hesabınızı bağlayın.
                                </p>
                                <Button 
                                    onClick={() => connectMutation.mutate()}
                                    disabled={connectMutation.isPending}
                                    className="gap-2"
                                >
                                    <LinkIcon className="w-4 h-4" />
                                    {connectMutation.isPending ? 'Bağlanıyor...' : 'Gmail Hesabını Bağla'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Email Content - Only show if connected */}
                {isConnected && (
                    <>
                        {/* Search Bar */}
                        <div className="mb-6">
                            <Input
                                placeholder="Konu veya göndericiye göre ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="max-w-md"
                            />
                        </div>

                        {/* Error State */}
                        {emailsError && (
                            <Card className="p-8 text-center border-red-200 bg-red-50 mb-6">
                                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold text-red-900">E-postalar Yüklenemedi</h2>
                                <p className="text-red-700 mt-2">{emailsError?.message || 'Gmail\'den e-postalar alınamadı'}</p>
                                <Button onClick={() => refetch()} className="mt-4">Tekrar Dene</Button>
                            </Card>
                        )}

                        {/* Loading Emails */}
                        {emailsLoading && (
                            <Card className="p-8 text-center">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                <p className="text-gray-600">E-postalar yükleniyor...</p>
                            </Card>
                        )}

                        {/* Empty State */}
                        {!emailsLoading && !emailsError && emailData.emails.length === 0 && (
                            <Card className="p-8 text-center">
                                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-600">Gelen kutusunda e-posta yok</p>
                                <Button onClick={() => refetch()} variant="outline" className="mt-4">
                                    Tekrar Dene
                                </Button>
                            </Card>
                        )}

                        {/* No Search Results */}
                        {!emailsLoading && !emailsError && emailData.emails.length > 0 && filteredEmails.length === 0 && (
                            <Card className="p-8 text-center">
                                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-600">Aramanızla eşleşen e-posta bulunamadı</p>
                            </Card>
                        )}

                        {/* Email List */}
                        {!emailsLoading && !emailsError && filteredEmails.length > 0 && (
                            <div className="space-y-2">
                                <div className="text-sm text-gray-600 mb-4">
                                    {filteredEmails.length} / {emailData.emails.length} e-posta gösteriliyor
                                </div>

                                {filteredEmails.map((email) => (
                                    <Card
                                        key={email.id}
                                        className="hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => setExpandedEmail(expandedEmail === email.id ? null : email.id)}
                                    >
                                        <div className="p-4">
                                            {/* Email Header */}
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                        <h3 className="font-semibold text-gray-900 truncate">
                                                            {email.subject || '(Konu yok)'}
                                                        </h3>
                                                    </div>
                                                    <p className="text-sm text-gray-600 truncate">
                                                        Gönderen: {extractEmailAddress(email.from)}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-1">
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatEmailDate(email.date)}
                                                        </span>
                                                        {email.attachments?.length > 0 && (
                                                            <span className="text-xs text-blue-600 flex items-center gap-1">
                                                                <FileText className="w-3 h-3" />
                                                                {email.attachments.length} ek
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="ml-4 flex-shrink-0">
                                                    {expandedEmail === email.id ? (
                                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* AI Analysis Tags */}
                                            {emailAnalysis[email.id] && (
                                                <div className="mt-2">
                                                    <EmailAnalysis 
                                                        analysis={emailAnalysis[email.id]}
                                                        emailId={email.id}
                                                        emailData={email}
                                                        onCorrectionSaved={() => {}}
                                                    />
                                                </div>
                                            )}

                                            {/* Email Preview */}
                                            {expandedEmail !== email.id && (
                                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                                    {email.snippet}
                                                </p>
                                            )}

                                            {/* Expanded Content */}
                                            {expandedEmail === email.id && (
                                                <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                                                    {/* AI Analysis Button */}
                                                    {!emailAnalysis[email.id] && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                analyzeEmailMutation.mutate({ ...email, id: email.id });
                                                            }}
                                                            disabled={analyzeEmailMutation.isPending}
                                                            className="w-full"
                                                        >
                                                            {analyzeEmailMutation.isPending ? 'Analiz ediliyor...' : 'AI Analizi'}
                                                        </Button>
                                                    )}

                                                    {/* Full Body */}
                                                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 max-h-64 overflow-y-auto whitespace-pre-wrap break-words">
                                                        {email.body || email.snippet}
                                                    </div>

                                                    {/* Attachments */}
                                                    {email.attachments?.length > 0 && (
                                                        <div className="bg-blue-50 p-3 rounded">
                                                            <h4 className="text-sm font-semibold text-blue-900 mb-2">
                                                                Ekler ({email.attachments.length})
                                                            </h4>
                                                            <div className="space-y-1">
                                                                {email.attachments.map((attachment, idx) => (
                                                                    <div key={idx} className="flex items-center gap-2 text-sm text-blue-700">
                                                                        <FileText className="w-4 h-4" />
                                                                        <span>{attachment.filename}</span>
                                                                        <span className="text-xs text-blue-600">
                                                                            ({Math.round(attachment.size / 1024)}KB)
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-2 pt-2">
                                                        <Button
                                                            size="sm"
                                                            className="flex-1"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleProcessEmail(email);
                                                            }}
                                                        >
                                                            Başvuru Olarak İşle
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                ))}

                                {/* Load More Button */}
                                {filteredEmails.length >= maxResults && (
                                    <div className="text-center mt-6">
                                        <Button
                                            variant="outline"
                                            onClick={() => setMaxResults(prev => prev + 20)}
                                        >
                                            Daha Fazla Yükle
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Process Application Dialog */}
                <ProcessApplicationDialog
                    email={selectedEmail}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    onSuccess={() => refetch()}
                />
            </div>
        </div>
    );
}