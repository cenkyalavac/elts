import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2 } from "lucide-react";

export default function AICategorizer({ subject, message, onCategoryChange, onPriorityChange }) {
    const [analyzing, setAnalyzing] = useState(false);
    const [suggestion, setSuggestion] = useState(null);

    useEffect(() => {
        const analyzeContent = async () => {
            if (subject.length < 5 && message.length < 10) {
                setSuggestion(null);
                return;
            }

            setAnalyzing(true);
            try {
                const response = await base44.integrations.Core.InvokeLLM({
                    prompt: `Analyze this support ticket and categorize it:

Subject: ${subject}
Message: ${message}

Categories:
- general_question: General questions about the platform, process, or features
- technical_issue: Login problems, bugs, errors, system issues
- payment_inquiry: Payment status, invoices, rates, bank details
- application_status: Questions about application review, approval, tests
- other: Doesn't fit any category

Priority levels:
- low: Non-urgent, informational queries
- medium: Standard requests needing attention
- high: Important issues affecting work
- urgent: Critical issues blocking work or time-sensitive

Also detect the sentiment and suggest relevant tags for trend analysis.

Respond with JSON.`,
                    response_json_schema: {
                        type: 'object',
                        properties: {
                            category: { type: 'string' },
                            priority: { type: 'string' },
                            confidence: { type: 'number' },
                            sentiment: { type: 'string' },
                            tags: { type: 'array', items: { type: 'string' } },
                            reasoning: { type: 'string' }
                        }
                    }
                });

                if (response && response.confidence > 0.6) {
                    setSuggestion(response);
                }
            } catch (error) {
                console.error('AI categorization failed:', error);
            } finally {
                setAnalyzing(false);
            }
        };

        const debounce = setTimeout(analyzeContent, 1500);
        return () => clearTimeout(debounce);
    }, [subject, message]);

    const applyCategory = () => {
        if (suggestion?.category && onCategoryChange) {
            onCategoryChange(suggestion.category);
        }
    };

    const applyPriority = () => {
        if (suggestion?.priority && onPriorityChange) {
            onPriorityChange(suggestion.priority);
        }
    };

    if (!suggestion && !analyzing) return null;

    const categoryLabels = {
        general_question: 'General Question',
        technical_issue: 'Technical Issue',
        payment_inquiry: 'Payment Inquiry',
        application_status: 'Application Status',
        other: 'Other',
    };

    return (
        <div className="flex items-center gap-2 text-xs">
            {analyzing ? (
                <span className="flex items-center gap-1 text-gray-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Analyzing...
                </span>
            ) : suggestion && (
                <>
                    <Sparkles className="w-3 h-3 text-purple-500" />
                    <span className="text-gray-600">AI suggests:</span>
                    <Badge 
                        variant="outline" 
                        className="cursor-pointer hover:bg-purple-50 text-purple-700 border-purple-200"
                        onClick={applyCategory}
                    >
                        {categoryLabels[suggestion.category] || suggestion.category}
                    </Badge>
                    {suggestion.priority !== 'medium' && (
                        <Badge 
                            variant="outline" 
                            className={`cursor-pointer hover:bg-purple-50 ${
                                suggestion.priority === 'urgent' ? 'text-red-700 border-red-200' :
                                suggestion.priority === 'high' ? 'text-orange-700 border-orange-200' :
                                'text-gray-700 border-gray-200'
                            }`}
                            onClick={applyPriority}
                        >
                            {suggestion.priority} priority
                        </Badge>
                    )}
                </>
            )}
        </div>
    );
}

export function getAIAnalysis(subject, message) {
    return base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this support ticket:

Subject: ${subject}
Message: ${message}

Provide:
1. Category (general_question, technical_issue, payment_inquiry, application_status, other)
2. Priority (low, medium, high, urgent)
3. Sentiment (positive, neutral, negative, frustrated)
4. Tags for trend analysis (3-5 relevant tags)
5. Brief summary (one sentence)`,
        response_json_schema: {
            type: 'object',
            properties: {
                category: { type: 'string' },
                priority: { type: 'string' },
                sentiment: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                summary: { type: 'string' }
            }
        }
    });
}