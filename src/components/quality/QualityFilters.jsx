import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

const TRANSLATION_TYPES = ["Technical", "Marketing", "Legal", "Medical", "General", "UI/UX", "Support", "Creative"];
const REPORT_STATUSES = [
    { value: "draft", label: "Taslak" },
    { value: "submitted", label: "Gönderildi" },
    { value: "pending_translator_review", label: "Çevirmen İncelemesinde" },
    { value: "translator_accepted", label: "Kabul Edildi" },
    { value: "translator_disputed", label: "İtiraz Edildi" },
    { value: "pending_final_review", label: "Final İncelemede" },
    { value: "finalized", label: "Tamamlandı" }
];

export default function QualityFilters({ 
    filters, 
    setFilters, 
    freelancers, 
    clientAccounts = [],
    languages = { source: [], target: [] },
    showFreelancerFilter = true 
}) {
    const clearFilters = () => {
        setFilters({
            freelancer_id: "",
            translation_type: "",
            client_account: "",
            source_language: "",
            target_language: "",
            status: "",
            report_type: "",
            search: ""
        });
    };

    const hasActiveFilters = Object.values(filters).some(v => v && v !== "");

    return (
        <div className="bg-white border rounded-lg p-4 mb-4 space-y-4">
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        placeholder="Çevirmen veya proje ara..."
                        className="pl-10"
                    />
                </div>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="w-4 h-4 mr-1" />
                        Filtreleri Temizle
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {showFreelancerFilter && (
                    <Select
                        value={filters.freelancer_id}
                        onValueChange={(v) => setFilters(prev => ({ ...prev, freelancer_id: v === "all" ? "" : v }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Çevirmen" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Çevirmenler</SelectItem>
                            {freelancers
                                .filter(f => f.status === 'Approved')
                                .map(f => (
                                    <SelectItem key={f.id} value={f.id}>
                                        {f.full_name}
                                    </SelectItem>
                                ))
                            }
                        </SelectContent>
                    </Select>
                )}

                <Select
                    value={filters.translation_type}
                    onValueChange={(v) => setFilters(prev => ({ ...prev, translation_type: v === "all" ? "" : v }))}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Çeviri Alanı" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Alanlar</SelectItem>
                        {TRANSLATION_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.client_account}
                    onValueChange={(v) => setFilters(prev => ({ ...prev, client_account: v === "all" ? "" : v }))}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Müşteri" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Müşteriler</SelectItem>
                        {clientAccounts.map(account => (
                            <SelectItem key={account} value={account}>{account}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.source_language}
                    onValueChange={(v) => setFilters(prev => ({ ...prev, source_language: v === "all" ? "" : v }))}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Kaynak Dil" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Diller</SelectItem>
                        {languages.source.map(lang => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.target_language}
                    onValueChange={(v) => setFilters(prev => ({ ...prev, target_language: v === "all" ? "" : v }))}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Hedef Dil" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Diller</SelectItem>
                        {languages.target.map(lang => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.report_type}
                    onValueChange={(v) => setFilters(prev => ({ ...prev, report_type: v === "all" ? "" : v }))}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Rapor Tipi" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Tipler</SelectItem>
                        <SelectItem value="QS">QS</SelectItem>
                        <SelectItem value="LQA">LQA</SelectItem>
                        <SelectItem value="Random_QA">Random QA</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={filters.status}
                    onValueChange={(v) => setFilters(prev => ({ ...prev, status: v === "all" ? "" : v }))}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Durum" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Durumlar</SelectItem>
                        {REPORT_STATUSES.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}