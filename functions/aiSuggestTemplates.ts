import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { emailContent, subject, availableTemplates, freelancerStatus } = await req.json();

        const templatesText = availableTemplates
            .map(t => `- ${t.name}: ${t.description} (Trigger: ${t.trigger_type}, Status: ${t.trigger_status || 'any'})`)
            .join('\n');

        const prompt = `You are an email template suggestion assistant. Given an incoming email and available templates, suggest the best matching templates.

Incoming Email:
Subject: ${subject}
Content: ${emailContent}

Freelancer Status: ${freelancerStatus}

Available Templates:
${templatesText}

For each matching template (up to 3), provide:
1. Template name
2. Match score (0-1)
3. Brief reason for the match

Return as JSON with: { suggestions: [{ templateName: string, matchScore: number, reason: string, templatePreview: string }] }`;

        const { data } = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    suggestions: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                templateName: { type: 'string' },
                                matchScore: { type: 'number' },
                                reason: { type: 'string' },
                                templatePreview: { type: 'string' }
                            }
                        }
                    }
                }
            }
        });

        return Response.json({
            suggestions: data.suggestions || []
        });
    } catch (error) {
        console.error('Error suggesting templates:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});