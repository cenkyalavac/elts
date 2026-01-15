import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Plus, X, Shield, Save } from "lucide-react";
import { toast } from "sonner";

const TRANSLATION_TYPES = ["Technical", "Marketing", "Legal", "Medical", "General", "UI/UX", "Support", "Creative"];

export default function FreelancerLQACapabilities({ freelancer, onUpdate }) {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [canDoLqa, setCanDoLqa] = useState(freelancer.can_do_lqa || false);
    const [lqaLanguages, setLqaLanguages] = useState(freelancer.lqa_languages || []);
    const [lqaSpecializations, setLqaSpecializations] = useState(freelancer.lqa_specializations || []);
    
    const [newLanguage, setNewLanguage] = useState({ source_language: "", target_language: "" });

    const updateMutation = useMutation({
        mutationFn: (data) => base44.entities.Freelancer.update(freelancer.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['freelancer', freelancer.id] });
            queryClient.invalidateQueries({ queryKey: ['freelancers'] });
            toast.success("LQA yetenekleri güncellendi");
            setIsEditing(false);
            if (onUpdate) onUpdate();
        },
    });

    const handleAddLanguage = () => {
        if (newLanguage.source_language && newLanguage.target_language) {
            setLqaLanguages([...lqaLanguages, newLanguage]);
            setNewLanguage({ source_language: "", target_language: "" });
        }
    };

    const handleRemoveLanguage = (index) => {
        setLqaLanguages(lqaLanguages.filter((_, i) => i !== index));
    };

    const handleToggleSpec = (spec) => {
        if (lqaSpecializations.includes(spec)) {
            setLqaSpecializations(lqaSpecializations.filter(s => s !== spec));
        } else {
            setLqaSpecializations([...lqaSpecializations, spec]);
        }
    };

    const handleSave = () => {
        updateMutation.mutate({
            can_do_lqa: canDoLqa,
            lqa_languages: lqaLanguages,
            lqa_specializations: lqaSpecializations
        });
    };

    if (!isEditing) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            LQA Yetenekleri
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            Düzenle
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {freelancer.can_do_lqa ? (
                        <div className="space-y-4">
                            <Badge className="bg-green-100 text-green-700">LQA Yapabilir</Badge>
                            
                            {freelancer.lqa_languages?.length > 0 && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">LQA Dil Çiftleri</p>
                                    <div className="flex flex-wrap gap-2">
                                        {freelancer.lqa_languages.map((lp, i) => (
                                            <Badge key={i} variant="outline">
                                                {lp.source_language} → {lp.target_language}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {freelancer.lqa_specializations?.length > 0 && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">LQA Uzmanlıkları</p>
                                    <div className="flex flex-wrap gap-2">
                                        {freelancer.lqa_specializations.map((spec, i) => (
                                            <Badge key={i} className="bg-purple-100 text-purple-700">
                                                {spec}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500">LQA yapma yetkisi yok</p>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    LQA Yeteneklerini Düzenle
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                        <Label>LQA Yapabilir</Label>
                        <p className="text-xs text-gray-500">Bu freelancer LQA review yapabilir mi?</p>
                    </div>
                    <Switch
                        checked={canDoLqa}
                        onCheckedChange={setCanDoLqa}
                    />
                </div>

                {canDoLqa && (
                    <>
                        {/* LQA Languages */}
                        <div>
                            <Label className="mb-2 block">LQA Dil Çiftleri</Label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {lqaLanguages.map((lp, i) => (
                                    <Badge key={i} variant="outline" className="flex items-center gap-1">
                                        {lp.source_language} → {lp.target_language}
                                        <button onClick={() => handleRemoveLanguage(i)}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Kaynak (EN)"
                                    value={newLanguage.source_language}
                                    onChange={(e) => setNewLanguage(prev => ({ 
                                        ...prev, 
                                        source_language: e.target.value.toUpperCase() 
                                    }))}
                                    className="w-24"
                                />
                                <span className="self-center">→</span>
                                <Input
                                    placeholder="Hedef (TR)"
                                    value={newLanguage.target_language}
                                    onChange={(e) => setNewLanguage(prev => ({ 
                                        ...prev, 
                                        target_language: e.target.value.toUpperCase() 
                                    }))}
                                    className="w-24"
                                />
                                <Button type="button" variant="outline" size="sm" onClick={handleAddLanguage}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* LQA Specializations */}
                        <div>
                            <Label className="mb-2 block">LQA Uzmanlık Alanları</Label>
                            <div className="flex flex-wrap gap-2">
                                {TRANSLATION_TYPES.map(spec => (
                                    <Badge
                                        key={spec}
                                        className={`cursor-pointer transition-all ${
                                            lqaSpecializations.includes(spec)
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                        onClick={() => handleToggleSpec(spec)}
                                    >
                                        {spec}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                        İptal
                    </Button>
                    <Button 
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Kaydet
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}