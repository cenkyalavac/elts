import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
    Settings2, Save, Trash2, FileSpreadsheet, Plus, Check, Loader2, ArrowRight, Star
} from "lucide-react";

// Smartcat field definitions
const SMARTCAT_FIELDS = [
    { key: 'invoiceCode', label: 'Invoice Code', required: true },
    { key: 'resource', label: 'Resource/Freelancer Name', required: true },
    { key: 'status', label: 'Status', required: false },
    { key: 'totalCost', label: 'Total Cost/Amount', required: true },
    { key: 'currency', label: 'Currency', required: false },
    { key: 'vat', label: 'VAT/Tax', required: false },
    { key: 'dateSent', label: 'Date Sent', required: false },
    { key: 'datePaid', label: 'Date Paid', required: false },
    { key: 'description', label: 'Description', required: false },
    { key: 'project', label: 'Project', required: false },
    { key: 'sourceLanguage', label: 'Source Language', required: false },
    { key: 'targetLanguage', label: 'Target Language', required: false },
    { key: 'wordCount', label: 'Word Count', required: false },
    { key: 'rate', label: 'Rate', required: false },
    { key: 'service', label: 'Service Type', required: false },
];

const SERVICE_TYPES = [
    'Translation', 'Editing', 'Proofreading', 'Postediting', 'Copywriting',
    'TranslationAndEditing', 'QualityAssurance', 'Dtp', 'Testing', 'Review',
    'Interpreting', 'Transcription', 'Subtitling', 'VoiceOver', 'Other'
];

const UNIT_TYPES = ['Words', 'Characters', 'Hours', 'Pages', 'Documents'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'TRY'];

export default function CsvMappingManager({ 
    detectedColumns = [], 
    onApplyMapping, 
    currentMapping = {},
    currentDefaults = {},
    onDefaultTemplateLoad
}) {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateDescription, setNewTemplateDescription] = useState('');
    const [defaultTemplateLoaded, setDefaultTemplateLoaded] = useState(false);
    
    // Local mapping state
    const [mapping, setMapping] = useState(() => {
        const initial = {};
        SMARTCAT_FIELDS.forEach(field => {
            initial[field.key] = currentMapping[field.key] || '';
        });
        return initial;
    });
    
    // Local defaults state
    const [defaults, setDefaults] = useState({
        serviceType: currentDefaults.serviceType || 'Translation',
        unitsType: currentDefaults.unitsType || 'Words',
        currency: currentDefaults.currency || 'USD'
    });

    // Fetch saved templates
    const { data: templates = [], isLoading: templatesLoading } = useQuery({
        queryKey: ['csvMappingTemplates'],
        queryFn: () => base44.entities.CsvMappingTemplate.list(),
    });

    // Auto-load default template on mount
    React.useEffect(() => {
        if (!defaultTemplateLoaded && templates.length > 0) {
            const defaultTemplate = templates.find(t => t.is_default);
            if (defaultTemplate && onDefaultTemplateLoad) {
                onDefaultTemplateLoad(defaultTemplate.column_mappings || {}, {
                    serviceType: defaultTemplate.default_service_type || 'Translation',
                    unitsType: defaultTemplate.default_units_type || 'Words',
                    currency: defaultTemplate.default_currency || 'USD'
                });
                setMapping(defaultTemplate.column_mappings || {});
                setDefaults({
                    serviceType: defaultTemplate.default_service_type || 'Translation',
                    unitsType: defaultTemplate.default_units_type || 'Words',
                    currency: defaultTemplate.default_currency || 'USD'
                });
            }
            setDefaultTemplateLoaded(true);
        }
    }, [templates, defaultTemplateLoaded, onDefaultTemplateLoad]);

    // Save template mutation
    const saveTemplateMutation = useMutation({
        mutationFn: (data) => base44.entities.CsvMappingTemplate.create(data),
        onSuccess: () => {
            toast.success('Template saved successfully');
            queryClient.invalidateQueries({ queryKey: ['csvMappingTemplates'] });
            setIsSaveDialogOpen(false);
            setNewTemplateName('');
            setNewTemplateDescription('');
        },
        onError: (error) => {
            toast.error(`Failed to save template: ${error.message}`);
        }
    });

    // Delete template mutation
    const deleteTemplateMutation = useMutation({
        mutationFn: (id) => base44.entities.CsvMappingTemplate.delete(id),
        onSuccess: () => {
            toast.success('Template deleted');
            queryClient.invalidateQueries({ queryKey: ['csvMappingTemplates'] });
        },
        onError: (error) => {
            toast.error(`Failed to delete template: ${error.message}`);
        }
    });

    // Set as default mutation
    const setDefaultMutation = useMutation({
        mutationFn: async (templateId) => {
            // First, unset all other defaults
            const currentDefaults = templates.filter(t => t.is_default && t.id !== templateId);
            for (const t of currentDefaults) {
                await base44.entities.CsvMappingTemplate.update(t.id, { is_default: false });
            }
            // Set the new default
            await base44.entities.CsvMappingTemplate.update(templateId, { is_default: true });
        },
        onSuccess: () => {
            toast.success('Default template updated');
            queryClient.invalidateQueries({ queryKey: ['csvMappingTemplates'] });
        },
        onError: (error) => {
            toast.error(`Failed to set default: ${error.message}`);
        }
    });

    // Update last used mutation
    const updateLastUsedMutation = useMutation({
        mutationFn: (templateId) => base44.entities.CsvMappingTemplate.update(templateId, { 
            last_used_date: new Date().toISOString() 
        }),
    });

    // Auto-detect mapping based on column names
    const autoDetectMapping = () => {
        const newMapping = {};
        const columnLower = detectedColumns.map(c => c.toLowerCase());
        
        SMARTCAT_FIELDS.forEach(field => {
            const fieldKey = field.key.toLowerCase();
            const fieldLabel = field.label.toLowerCase();
            
            // Find matching column
            let matchedColumn = null;
            
            // Direct match
            const directMatch = detectedColumns.find(col => 
                col.toLowerCase() === fieldKey || 
                col.toLowerCase().replace(/[_\s]/g, '') === fieldKey.replace(/[_\s]/g, '')
            );
            if (directMatch) {
                matchedColumn = directMatch;
            }
            
            // Partial match
            if (!matchedColumn) {
                const partialMatch = detectedColumns.find(col => {
                    const colLower = col.toLowerCase();
                    return colLower.includes(fieldKey) || 
                           fieldKey.includes(colLower) ||
                           colLower.includes(fieldLabel.split('/')[0].trim()) ||
                           colLower.includes(fieldLabel.split(' ')[0].toLowerCase());
                });
                if (partialMatch) matchedColumn = partialMatch;
            }
            
            // Special cases
            if (!matchedColumn) {
                switch (field.key) {
                    case 'invoiceCode':
                        matchedColumn = detectedColumns.find(c => 
                            /invoice|code|number|ref/i.test(c)
                        );
                        break;
                    case 'resource':
                        matchedColumn = detectedColumns.find(c => 
                            /resource|freelancer|name|translator|vendor|supplier/i.test(c)
                        );
                        break;
                    case 'totalCost':
                        matchedColumn = detectedColumns.find(c => 
                            /total|cost|amount|payment|sum|price/i.test(c)
                        );
                        break;
                    case 'wordCount':
                        matchedColumn = detectedColumns.find(c => 
                            /word|count|volume|units/i.test(c)
                        );
                        break;
                }
            }
            
            newMapping[field.key] = matchedColumn || '';
        });
        
        setMapping(newMapping);
        toast.success('Auto-detected column mappings');
    };

    // Load template
    const loadTemplate = (template) => {
        if (template.column_mappings) {
            setMapping(template.column_mappings);
        }
        setDefaults({
            serviceType: template.default_service_type || 'Translation',
            unitsType: template.default_units_type || 'Words',
            currency: template.default_currency || 'USD'
        });
        // Update last used
        updateLastUsedMutation.mutate(template.id);
        toast.success(`Loaded template: ${template.name}`);
    };

    // Save current mapping as template
    const saveAsTemplate = () => {
        if (!newTemplateName.trim()) {
            toast.error('Please enter a template name');
            return;
        }
        
        saveTemplateMutation.mutate({
            name: newTemplateName.trim(),
            description: newTemplateDescription.trim(),
            column_mappings: mapping,
            default_service_type: defaults.serviceType,
            default_units_type: defaults.unitsType,
            default_currency: defaults.currency
        });
    };

    // Apply mapping
    const applyMapping = () => {
        onApplyMapping(mapping, defaults);
        setIsOpen(false);
        toast.success('Mapping applied');
    };

    // Count mapped fields
    const mappedCount = Object.values(mapping).filter(v => v).length;
    const requiredFields = SMARTCAT_FIELDS.filter(f => f.required);
    const requiredMapped = requiredFields.filter(f => mapping[f.key]).length;

    return (
        <>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsOpen(true)}
                className="gap-2"
            >
                <Settings2 className="w-4 h-4" />
                Column Mapping
                {mappedCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                        {mappedCount}/{SMARTCAT_FIELDS.length}
                    </Badge>
                )}
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5" />
                            CSV Column Mapping
                        </DialogTitle>
                        <DialogDescription>
                            Map your CSV columns to Smartcat payment fields. Required fields are marked with *.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Saved Templates */}
                        {templates.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Saved Templates</Label>
                                <div className="flex flex-wrap gap-2">
                                    {templates.map(template => (
                                        <div key={template.id} className="flex items-center gap-1">
                                            <Button
                                                variant={template.is_default ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => loadTemplate(template)}
                                                className="gap-2"
                                            >
                                                {template.is_default && <Star className="w-3 h-3 fill-current" />}
                                                <FileSpreadsheet className="w-3 h-3" />
                                                {template.name}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-8 w-8 ${template.is_default ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                                                onClick={() => setDefaultMutation.mutate(template.id)}
                                                title="Set as default"
                                            >
                                                <Star className={`w-3 h-3 ${template.is_default ? 'fill-current' : ''}`} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-700"
                                                onClick={() => deleteTemplateMutation.mutate(template.id)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Auto-detect button */}
                        {detectedColumns.length > 0 && (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">
                                        {detectedColumns.length} columns detected in CSV
                                    </p>
                                </div>
                                <Button variant="secondary" size="sm" onClick={autoDetectMapping}>
                                    Auto-Detect Mapping
                                </Button>
                            </div>
                        )}

                        {/* Column Mappings */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Field Mappings</Label>
                            <div className="grid gap-3">
                                {SMARTCAT_FIELDS.map(field => (
                                    <div key={field.key} className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                                        <div className="text-sm">
                                            {field.label}
                                            {field.required && <span className="text-red-500 ml-1">*</span>}
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-400" />
                                        <Select 
                                            value={mapping[field.key] || 'none'} 
                                            onValueChange={(v) => setMapping({...mapping, [field.key]: v === 'none' ? '' : v})}
                                        >
                                            <SelectTrigger className={`h-9 ${mapping[field.key] ? 'border-green-300 bg-green-50' : ''}`}>
                                                <SelectValue placeholder="Select column..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">-- Not mapped --</SelectItem>
                                                {detectedColumns.map(col => (
                                                    <SelectItem key={col} value={col}>{col}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Default Values */}
                        <div className="space-y-3 pt-4 border-t">
                            <Label className="text-sm font-medium">Default Values</Label>
                            <p className="text-xs text-gray-500">Used when CSV doesn't contain these fields</p>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <Label className="text-xs">Service Type</Label>
                                    <Select value={defaults.serviceType} onValueChange={(v) => setDefaults({...defaults, serviceType: v})}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SERVICE_TYPES.map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs">Unit Type</Label>
                                    <Select value={defaults.unitsType} onValueChange={(v) => setDefaults({...defaults, unitsType: v})}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {UNIT_TYPES.map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs">Currency</Label>
                                    <Select value={defaults.currency} onValueChange={(v) => setDefaults({...defaults, currency: v})}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CURRENCIES.map(c => (
                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Validation Status */}
                        <div className={`p-3 rounded-lg ${requiredMapped === requiredFields.length ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                            <div className="flex items-center gap-2">
                                {requiredMapped === requiredFields.length ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                    <Settings2 className="w-4 h-4 text-amber-600" />
                                )}
                                <span className={`text-sm font-medium ${requiredMapped === requiredFields.length ? 'text-green-700' : 'text-amber-700'}`}>
                                    {requiredMapped}/{requiredFields.length} required fields mapped
                                </span>
                            </div>
                            {requiredMapped < requiredFields.length && (
                                <p className="text-xs text-amber-600 mt-1">
                                    Missing: {requiredFields.filter(f => !mapping[f.key]).map(f => f.label).join(', ')}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="flex justify-between">
                        <Button variant="outline" onClick={() => setIsSaveDialogOpen(true)}>
                            <Save className="w-4 h-4 mr-2" />
                            Save as Template
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={applyMapping} className="gap-2">
                                <Check className="w-4 h-4" />
                                Apply Mapping
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Save Template Dialog */}
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Save Mapping Template</DialogTitle>
                        <DialogDescription>
                            Save this mapping configuration for future use.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Template Name *</Label>
                            <Input
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                placeholder="e.g., TBMS Export Format"
                            />
                        </div>
                        <div>
                            <Label>Description (optional)</Label>
                            <Input
                                value={newTemplateDescription}
                                onChange={(e) => setNewTemplateDescription(e.target.value)}
                                placeholder="e.g., Standard TBMS invoice export"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsSaveDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={saveAsTemplate}
                            disabled={saveTemplateMutation.isPending || !newTemplateName.trim()}
                        >
                            {saveTemplateMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Save Template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}