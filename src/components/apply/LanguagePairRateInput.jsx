import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, DollarSign } from "lucide-react";

const COMMON_LANGUAGES = [
  'English', 'Turkish', 'French', 'French (Canadian)', 'German', 'Spanish', 
  'Spanish (Latin America)', 'Italian', 'Portuguese', 'Portuguese (Brazil)',
  'Arabic', 'Chinese (Simplified)', 'Chinese (Traditional)', 'Japanese', 
  'Korean', 'Russian', 'Dutch', 'Greek'
];

const COMMON_SPECIALIZATIONS = [
  'Legal', 'Medical', 'Technical', 'Financial', 'Marketing', 
  'IT/Software', 'Literary', 'Scientific', 'General'
];

const COMMON_TOOLS = [
  'SDL Trados', 'MemoQ', 'Wordfast', 'Smartcat', 'XTM', 
  'Phrase', 'Memsource', 'No CAT Tool'
];

export default function LanguagePairRateInput({ languagePairs, onChange }) {
    const [newPair, setNewPair] = useState({
        source_language: '',
        target_language: '',
        proficiency: 'Professional',
        rates: []
    });

    const [showRateForm, setShowRateForm] = useState(false);
    const [currentPairIndex, setCurrentPairIndex] = useState(null);
    const [newRate, setNewRate] = useState({
        specialization: '',
        tool: '',
        rate_type: 'per_word',
        rate_value: '',
        currency: 'USD'
    });

    const addLanguagePair = () => {
        if (newPair.source_language && newPair.target_language) {
            onChange([...(languagePairs || []), { ...newPair, rates: [] }]);
            setNewPair({
                source_language: '',
                target_language: '',
                proficiency: 'Professional',
                rates: []
            });
        }
    };

    const removePair = (index) => {
        onChange(languagePairs.filter((_, i) => i !== index));
    };

    const addRateToPair = (pairIndex) => {
        if (newRate.rate_value) {
            const updated = [...languagePairs];
            updated[pairIndex].rates = [...(updated[pairIndex].rates || []), newRate];
            onChange(updated);
            setNewRate({
                specialization: '',
                tool: '',
                rate_type: 'per_word',
                rate_value: '',
                currency: 'USD'
            });
            setShowRateForm(false);
            setCurrentPairIndex(null);
        }
    };

    const removeRate = (pairIndex, rateIndex) => {
        const updated = [...languagePairs];
        updated[pairIndex].rates = updated[pairIndex].rates.filter((_, i) => i !== rateIndex);
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            {/* Add New Language Pair */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Source Language</Label>
                                <input
                                    list="source-languages"
                                    className="w-full border rounded-md p-2"
                                    value={newPair.source_language}
                                    onChange={(e) => setNewPair({ ...newPair, source_language: e.target.value })}
                                    placeholder="Type or select..."
                                />
                                <datalist id="source-languages">
                                    {COMMON_LANGUAGES.map(lang => (
                                        <option key={lang} value={lang} />
                                    ))}
                                </datalist>
                            </div>
                            <div>
                                <Label>Target Language</Label>
                                <input
                                    list="target-languages"
                                    className="w-full border rounded-md p-2"
                                    value={newPair.target_language}
                                    onChange={(e) => setNewPair({ ...newPair, target_language: e.target.value })}
                                    placeholder="Type or select..."
                                />
                                <datalist id="target-languages">
                                    {COMMON_LANGUAGES.map(lang => (
                                        <option key={lang} value={lang} />
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        <div>
                            <Label>Proficiency Level</Label>
                            <select
                                className="w-full border rounded-md p-2"
                                value={newPair.proficiency}
                                onChange={(e) => setNewPair({ ...newPair, proficiency: e.target.value })}
                            >
                                <option value="Native">Native</option>
                                <option value="Fluent">Fluent</option>
                                <option value="Professional">Professional</option>
                                <option value="Intermediate">Intermediate</option>
                            </select>
                        </div>

                        <Button type="button" onClick={addLanguagePair} className="w-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Language Pair
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Display Added Pairs */}
            {languagePairs && languagePairs.length > 0 && (
                <div className="space-y-3">
                    {languagePairs.map((pair, pairIdx) => (
                        <Card key={pairIdx}>
                            <CardContent className="pt-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-base px-3 py-1">
                                                    {pair.source_language} → {pair.target_language}
                                                </Badge>
                                                <Badge variant="secondary">{pair.proficiency}</Badge>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removePair(pairIdx)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {/* Rates for this pair */}
                                    {pair.rates && pair.rates.length > 0 && (
                                        <div className="space-y-2 pl-4 border-l-2">
                                            {pair.rates.map((rate, rateIdx) => (
                                                <div key={rateIdx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <DollarSign className="w-3 h-3 text-green-600" />
                                                        <span className="font-medium">{rate.rate_value} {rate.currency}</span>
                                                        <span className="text-gray-600">
                                                            {rate.rate_type.replace('_', ' ')}
                                                        </span>
                                                        {rate.specialization && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {rate.specialization}
                                                            </Badge>
                                                        )}
                                                        {rate.tool && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {rate.tool}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeRate(pairIdx, rateIdx)}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add Rate Button */}
                                    {showRateForm && currentPairIndex === pairIdx ? (
                                        <div className="space-y-3 pl-4 border-l-2 bg-blue-50 p-3 rounded">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-xs">Rate Value</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={newRate.rate_value}
                                                        onChange={(e) => setNewRate({ ...newRate, rate_value: e.target.value })}
                                                        placeholder="0.12"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Rate Type</Label>
                                                    <select
                                                        className="w-full border rounded-md p-2 text-sm"
                                                        value={newRate.rate_type}
                                                        onChange={(e) => setNewRate({ ...newRate, rate_type: e.target.value })}
                                                    >
                                                        <option value="per_word">Per Word</option>
                                                        <option value="per_hour">Per Hour</option>
                                                        <option value="per_page">Per Page</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-xs">Specialization (Optional)</Label>
                                                <input
                                                    list="specializations"
                                                    className="w-full border rounded-md p-2 text-sm"
                                                    value={newRate.specialization}
                                                    onChange={(e) => setNewRate({ ...newRate, specialization: e.target.value })}
                                                    placeholder="e.g., Legal, Medical..."
                                                />
                                                <datalist id="specializations">
                                                    {COMMON_SPECIALIZATIONS.map(spec => (
                                                        <option key={spec} value={spec} />
                                                    ))}
                                                </datalist>
                                            </div>

                                            <div>
                                                <Label className="text-xs">CAT Tool (Optional)</Label>
                                                <input
                                                    list="tools"
                                                    className="w-full border rounded-md p-2 text-sm"
                                                    value={newRate.tool}
                                                    onChange={(e) => setNewRate({ ...newRate, tool: e.target.value })}
                                                    placeholder="e.g., SDL Trados, MemoQ..."
                                                />
                                                <datalist id="tools">
                                                    {COMMON_TOOLS.map(tool => (
                                                        <option key={tool} value={tool} />
                                                    ))}
                                                </datalist>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => addRateToPair(pairIdx)}
                                                >
                                                    Add Rate
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setShowRateForm(false);
                                                        setCurrentPairIndex(null);
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setShowRateForm(true);
                                                setCurrentPairIndex(pairIdx);
                                            }}
                                        >
                                            <Plus className="w-3 h-3 mr-2" />
                                            Add Rate
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}