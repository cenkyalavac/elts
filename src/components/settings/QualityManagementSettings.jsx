import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Calculator, Clock, AlertTriangle } from "lucide-react";

export default function QualityManagementSettings() {
    const queryClient = useQueryClient();
    
    const { data: existingSettings } = useQuery({
        queryKey: ['qualitySettings'],
        queryFn: async () => {
            const settings = await base44.entities.QualitySettings.list();
            return settings[0] || null;
        },
    });

    const [settings, setSettings] = useState({
        setting_key: "default",
        dispute_period_days: 7,
        lqa_weight: 4,
        qs_multiplier: 20,
        auto_accept_enabled: true,
        probation_threshold: 70,
        lqa_error_weights: {
            Critical: 10,
            Major: 5,
            Minor: 2,
            Preferential: 0.5
        }
    });

    useEffect(() => {
        if (existingSettings) {
            setSettings({
                ...settings,
                ...existingSettings,
                lqa_error_weights: existingSettings.lqa_error_weights || settings.lqa_error_weights
            });
        }
    }, [existingSettings]);

    const saveMutation = useMutation({
        mutationFn: async (data) => {
            if (existingSettings?.id) {
                return base44.entities.QualitySettings.update(existingSettings.id, data);
            } else {
                return base44.entities.QualitySettings.create(data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['qualitySettings'] });
            toast.success("Kalite ayarları kaydedildi");
        },
        onError: () => {
            toast.error("Ayarlar kaydedilemedi");
        }
    });

    // Preview combined score calculation
    const previewScore = () => {
        const sampleLqa = 85;
        const sampleQs = 4;
        return ((sampleLqa * settings.lqa_weight) + (sampleQs * settings.qs_multiplier)) / (settings.lqa_weight + 1);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        Combined Score Hesaplama
                    </CardTitle>
                    <CardDescription>
                        LQA ve QS puanlarının birleşik skora nasıl dönüştürüleceğini ayarlayın
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <Label>LQA Ağırlığı (Weight)</Label>
                            <Input
                                type="number"
                                min="1"
                                max="10"
                                step="0.5"
                                value={settings.lqa_weight}
                                onChange={(e) => setSettings(prev => ({ 
                                    ...prev, 
                                    lqa_weight: parseFloat(e.target.value) || 4 
                                }))}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                LQA puanı bu sayı ile çarpılır (önerilen: 4)
                            </p>
                        </div>
                        <div>
                            <Label>QS Çarpanı (Multiplier)</Label>
                            <Input
                                type="number"
                                min="1"
                                max="30"
                                step="1"
                                value={settings.qs_multiplier}
                                onChange={(e) => setSettings(prev => ({ 
                                    ...prev, 
                                    qs_multiplier: parseFloat(e.target.value) || 20 
                                }))}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                QS (5 üzerinden) bu sayı ile çarpılarak 100'e dönüştürülür
                            </p>
                        </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-purple-700 mb-2">Formül Önizleme</p>
                        <code className="text-sm bg-white px-2 py-1 rounded">
                            Combined = (LQA × {settings.lqa_weight} + QS × {settings.qs_multiplier}) / {settings.lqa_weight + 1}
                        </code>
                        <p className="text-xs text-purple-600 mt-2">
                            Örnek: LQA=85, QS=4 → Combined = {previewScore().toFixed(1)}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        İtiraz ve Onay Süreleri
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <Label>İtiraz Süresi (Gün)</Label>
                            <Input
                                type="number"
                                min="1"
                                max="30"
                                value={settings.dispute_period_days}
                                onChange={(e) => setSettings(prev => ({ 
                                    ...prev, 
                                    dispute_period_days: parseInt(e.target.value) || 7 
                                }))}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Çevirmenin LQA raporuna itiraz edebileceği süre
                            </p>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <Label>Otomatik Kabul</Label>
                                <p className="text-xs text-gray-500">
                                    Süre dolduğunda raporu otomatik onayla
                                </p>
                            </div>
                            <Switch
                                checked={settings.auto_accept_enabled}
                                onCheckedChange={(checked) => setSettings(prev => ({ 
                                    ...prev, 
                                    auto_accept_enabled: checked 
                                }))}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        LQA Hata Ağırlıkları
                    </CardTitle>
                    <CardDescription>
                        Her hata seviyesinin puan kesintisini belirleyin (1000 kelime başına)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <Label className="text-red-600">Critical</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.5"
                                value={settings.lqa_error_weights?.Critical || 10}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    lqa_error_weights: {
                                        ...prev.lqa_error_weights,
                                        Critical: parseFloat(e.target.value) || 10
                                    }
                                }))}
                            />
                        </div>
                        <div>
                            <Label className="text-orange-600">Major</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.5"
                                value={settings.lqa_error_weights?.Major || 5}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    lqa_error_weights: {
                                        ...prev.lqa_error_weights,
                                        Major: parseFloat(e.target.value) || 5
                                    }
                                }))}
                            />
                        </div>
                        <div>
                            <Label className="text-yellow-600">Minor</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.5"
                                value={settings.lqa_error_weights?.Minor || 2}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    lqa_error_weights: {
                                        ...prev.lqa_error_weights,
                                        Minor: parseFloat(e.target.value) || 2
                                    }
                                }))}
                            />
                        </div>
                        <div>
                            <Label className="text-gray-600">Preferential</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.1"
                                value={settings.lqa_error_weights?.Preferential || 0.5}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    lqa_error_weights: {
                                        ...prev.lqa_error_weights,
                                        Preferential: parseFloat(e.target.value) || 0.5
                                    }
                                }))}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Probation Eşiği</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <Label>Combined Score Eşiği</Label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                value={settings.probation_threshold}
                                onChange={(e) => setSettings(prev => ({ 
                                    ...prev, 
                                    probation_threshold: parseInt(e.target.value) || 70 
                                }))}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Bu skorun altına düşen freelancerlar probation'a alınır
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button 
                    onClick={() => saveMutation.mutate(settings)}
                    disabled={saveMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {saveMutation.isPending ? "Kaydediliyor..." : "Ayarları Kaydet"}
                </Button>
            </div>
        </div>
    );
}