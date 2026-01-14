import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Linkedin, Loader2, Building2, ExternalLink, Sparkles } from 'lucide-react';

export default function LinkedInPostDialog({ position, open, onOpenChange }) {
    const [selectedCompany, setSelectedCompany] = useState('');
    const [postText, setPostText] = useState('');
    const queryClient = useQueryClient();

    const { data: linkedinData, isLoading: loadingCompanies } = useQuery({
        queryKey: ['linkedinCompanies'],
        queryFn: async () => {
            const response = await base44.functions.invoke('linkedinCompanyPages', {});
            return response.data;
        },
        enabled: open,
    });

    const companies = linkedinData?.companies || [];

    useEffect(() => {
        if (position && open) {
            generateDefaultPost();
        }
    }, [position, open]);

    const generateDefaultPost = () => {
        if (!position) return;
        
        const langPairs = position.language_pairs?.map(p => `${p.source_language} → ${p.target_language}`).join(', ') || '';
        const services = position.required_service_types?.join(', ') || '';
        
        let text = `🌍 We're Hiring: ${position.title}\n\n`;
        text += `${position.short_description || position.description}\n\n`;
        
        if (langPairs) {
            text += `🗣️ Languages: ${langPairs}\n`;
        }
        if (services) {
            text += `📋 Services: ${services}\n`;
        }
        if (position.min_experience_years) {
            text += `⭐ Experience: ${position.min_experience_years}+ years\n`;
        }
        if (position.location_type) {
            text += `📍 Location: ${position.location_type.charAt(0).toUpperCase() + position.location_type.slice(1)}\n`;
        }
        
        text += `\n✨ Join our team of language professionals!\n\n`;
        text += `Apply now 👇\n`;
        text += `#hiring #translation #localization #languagejobs #freelance`;
        
        setPostText(text);
    };

    const generateWithAI = useMutation({
        mutationFn: async () => {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `Create an engaging LinkedIn job post for this position:

Title: ${position.title}
Description: ${position.description}
Language Pairs: ${position.language_pairs?.map(p => `${p.source_language} to ${p.target_language}`).join(', ') || 'Various'}
Services: ${position.required_service_types?.join(', ') || 'Translation services'}
Experience Required: ${position.min_experience_years || 'Not specified'} years
Location Type: ${position.location_type || 'Remote'}

Write a compelling, professional LinkedIn post that:
1. Starts with an attention-grabbing emoji and headline
2. Highlights key requirements and benefits
3. Uses appropriate emojis sparingly
4. Includes relevant hashtags at the end
5. Has a clear call-to-action to apply
6. Is under 1300 characters

Return only the post text, no additional commentary.`,
            });
            return response;
        },
        onSuccess: (data) => {
            setPostText(data);
            toast.success('AI-generated post ready!');
        },
        onError: () => {
            toast.error('Failed to generate post');
        }
    });

    const postToLinkedIn = useMutation({
        mutationFn: async () => {
            const applyUrl = `${window.location.origin}/Apply?position=${position.id}`;
            const response = await base44.functions.invoke('postToLinkedIn', {
                positionId: position.id,
                companyUrn: selectedCompany,
                postText,
                applyUrl
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['openPositions'] });
            toast.success('Successfully posted to LinkedIn!');
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error('Failed to post: ' + (error.response?.data?.error || error.message));
        }
    });

    const isAlreadyPosted = !!position?.linkedin_post_id;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                        Post to LinkedIn
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {isAlreadyPosted && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                            <Badge className="bg-[#0A66C2]">Already Posted</Badge>
                            <span className="text-sm text-blue-700">
                                This position was posted on {new Date(position.linkedin_posted_at).toLocaleDateString()}
                            </span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Select Company Page</Label>
                        {loadingCompanies ? (
                            <div className="flex items-center gap-2 text-gray-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading company pages...
                            </div>
                        ) : companies.length === 0 ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                                <p className="font-medium">No company pages found</p>
                                <p>Make sure you have admin access to at least one LinkedIn company page.</p>
                            </div>
                        ) : (
                            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a company page" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map((company) => (
                                        <SelectItem key={company.urn} value={company.urn}>
                                            <div className="flex items-center gap-2">
                                                {company.logo ? (
                                                    <img src={company.logo} alt="" className="w-5 h-5 rounded" />
                                                ) : (
                                                    <Building2 className="w-5 h-5 text-gray-400" />
                                                )}
                                                {company.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Post Content</Label>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => generateWithAI.mutate()}
                                disabled={generateWithAI.isPending}
                                className="gap-2 text-purple-600"
                            >
                                {generateWithAI.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Sparkles className="w-4 h-4" />
                                )}
                                AI Generate
                            </Button>
                        </div>
                        <Textarea
                            value={postText}
                            onChange={(e) => setPostText(e.target.value)}
                            placeholder="Write your LinkedIn post..."
                            className="min-h-[250px]"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>{postText.length} characters</span>
                            <span className={postText.length > 3000 ? 'text-red-500' : ''}>
                                Max 3000 characters
                            </span>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                        <Label className="text-xs text-gray-500">Apply Link (auto-attached)</Label>
                        <div className="flex items-center gap-2 text-sm mt-1">
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">
                                {window.location.origin}/Apply?position={position?.id}
                            </span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => postToLinkedIn.mutate()}
                        disabled={postToLinkedIn.isPending || !selectedCompany || !postText || postText.length > 3000}
                        className="gap-2 bg-[#0A66C2] hover:bg-[#004182]"
                    >
                        {postToLinkedIn.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Linkedin className="w-4 h-4" />
                        )}
                        {postToLinkedIn.isPending ? 'Posting...' : isAlreadyPosted ? 'Post Again' : 'Post to LinkedIn'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}