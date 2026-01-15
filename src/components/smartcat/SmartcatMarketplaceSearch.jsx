import React, { useState } from 'react';
import { useMutation, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { 
    Search, UserPlus, Send, Loader2, Globe, Star, DollarSign,
    CheckCircle2, AlertCircle
} from "lucide-react";

const LANGUAGES = [
    "English", "Turkish", "German", "French", "Spanish", "Italian", 
    "Portuguese", "Russian", "Chinese", "Japanese", "Korean", "Arabic"
];

const SPECIALIZATIONS = [
    "General", "Legal", "Medical", "Technical", "Marketing", 
    "Financial", "IT/Software", "Gaming", "E-commerce"
];

export default function SmartcatMarketplaceSearch() {
    const [filters, setFilters] = useState({
        source_language: '',
        target_language: '',
        specialization: '',
        min_rate: '',
        max_rate: ''
    });
    const [searchResults, setSearchResults] = useState(null);
    const [selectedFreelancer, setSelectedFreelancer] = useState(null);
    const [inviteMessage, setInviteMessage] = useState('');
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

    const searchMutation = useMutation({
        mutationFn: async () => {
            const response = await base44.functions.invoke('smartcatMarketplace', {
                action: 'search_marketplace',
                filters: {
                    source_language: filters.source_language || undefined,
                    target_language: filters.target_language || undefined,
                    specialization: filters.specialization || undefined,
                    min_rate: filters.min_rate ? parseFloat(filters.min_rate) : undefined,
                    max_rate: filters.max_rate ? parseFloat(filters.max_rate) : undefined
                }
            });
            return response.data;
        },
        onSuccess: (data) => {
            setSearchResults(data);
        }
    });

    const inviteMutation = useMutation({
        mutationFn: async ({ email, name }) => {
            const response = await base44.functions.invoke('smartcatMarketplace', {
                action: 'invite_to_team',
                filters: {
                    email,
                    name,
                    message: inviteMessage
                }
            });
            return response.data;
        },
        onSuccess: () => {
            setInviteDialogOpen(false);
            setSelectedFreelancer(null);
            setInviteMessage('');
        }
    });

    const handleSearch = () => {
        searchMutation.mutate();
    };

    const handleInvite = (freelancer) => {
        setSelectedFreelancer(freelancer);
        setInviteDialogOpen(true);
    };

    const confirmInvite = () => {
        if (selectedFreelancer) {
            inviteMutation.mutate({
                email: selectedFreelancer.email,
                name: selectedFreelancer.name || selectedFreelancer.firstName
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Search Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Marketplace Araması
                    </CardTitle>
                    <CardDescription>
                        Smartcat marketplace'te belirli kriterlere uyan çevirmenleri bulun ve ekibinize davet edin.
                        Ekibinizdeki çevirmenlerle çalışmak daha düşük komisyon oranları sağlar.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                        <div className="space-y-2">
                            <Label>Kaynak Dil</Label>
                            <Select 
                                value={filters.source_language} 
                                onValueChange={(v) => setFilters({...filters, source_language: v})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGES.map(lang => (
                                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Hedef Dil</Label>
                            <Select 
                                value={filters.target_language} 
                                onValueChange={(v) => setFilters({...filters, target_language: v})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGES.map(lang => (
                                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Uzmanlık Alanı</Label>
                            <Select 
                                value={filters.specialization} 
                                onValueChange={(v) => setFilters({...filters, specialization: v})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SPECIALIZATIONS.map(spec => (
                                        <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Min Ücret ($/kelime)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.03"
                                value={filters.min_rate}
                                onChange={(e) => setFilters({...filters, min_rate: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Max Ücret ($/kelime)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.10"
                                value={filters.max_rate}
                                onChange={(e) => setFilters({...filters, max_rate: e.target.value})}
                            />
                        </div>
                    </div>
                    <Button onClick={handleSearch} disabled={searchMutation.isPending}>
                        {searchMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Search className="w-4 h-4 mr-2" />
                        )}
                        Ara
                    </Button>
                </CardContent>
            </Card>

            {/* Search Results */}
            {searchResults && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>
                                Arama Sonuçları ({searchResults.total || searchResults.freelancers?.length || 0})
                            </CardTitle>
                            {searchResults.source === 'team' && (
                                <Badge variant="outline">Ekipten</Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {searchResults.error ? (
                            <div className="text-center py-8">
                                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                                <p className="text-gray-600">{searchResults.error}</p>
                                {searchResults.suggestion && (
                                    <p className="text-sm text-gray-500 mt-2">{searchResults.suggestion}</p>
                                )}
                            </div>
                        ) : searchResults.freelancers?.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>İsim</TableHead>
                                        <TableHead>E-posta</TableHead>
                                        <TableHead>Diller</TableHead>
                                        <TableHead>Uzmanlık</TableHead>
                                        <TableHead>Ücret</TableHead>
                                        <TableHead>Rating</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {searchResults.freelancers.map((freelancer, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">
                                                {freelancer.name || `${freelancer.firstName} ${freelancer.lastName}`}
                                            </TableCell>
                                            <TableCell>{freelancer.email}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Globe className="w-3 h-3 text-gray-400" />
                                                    <span className="text-sm">
                                                        {freelancer.sourceLanguages?.join(', ') || '-'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {freelancer.specialization || 'General'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {freelancer.rate || freelancer.pricePerWord ? (
                                                    <span className="flex items-center gap-1 text-green-600">
                                                        <DollarSign className="w-3 h-3" />
                                                        {freelancer.rate || freelancer.pricePerWord}
                                                    </span>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {freelancer.rating ? (
                                                    <span className="flex items-center gap-1">
                                                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                        {freelancer.rating}
                                                    </span>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Button 
                                                    size="sm" 
                                                    onClick={() => handleInvite(freelancer)}
                                                >
                                                    <UserPlus className="w-4 h-4 mr-1" />
                                                    Davet Et
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p>Sonuç bulunamadı</p>
                                <p className="text-sm">Filtreleri değiştirip tekrar deneyin</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Invite Dialog */}
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ekibe Davet Et</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="font-medium">
                                {selectedFreelancer?.name || `${selectedFreelancer?.firstName} ${selectedFreelancer?.lastName}`}
                            </p>
                            <p className="text-sm text-gray-600">{selectedFreelancer?.email}</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Davet Mesajı (Opsiyonel)</Label>
                            <Textarea
                                value={inviteMessage}
                                onChange={(e) => setInviteMessage(e.target.value)}
                                placeholder="Kişiselleştirilmiş bir mesaj ekleyin..."
                                rows={4}
                            />
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>Not:</strong> Bu kişi hem Smartcat'e hem de Base44'e eklenecek ve 
                                bir davet e-postası gönderilecektir.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                            İptal
                        </Button>
                        <Button onClick={confirmInvite} disabled={inviteMutation.isPending}>
                            {inviteMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4 mr-2" />
                            )}
                            Davet Gönder
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}