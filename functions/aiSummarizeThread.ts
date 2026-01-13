import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { emailThread, subject } = await req.json();

        const prompt = `You are a professional email summarizer. Analyze this email thread and provide:
1. A concise summary (2-3 sentences)
2. Key points (bullet list)
3. Action items (bullet list)

Email Subject: ${subject}
Email Thread: ${emailThread}

Return as JSON with: { summary: string, keyPoints: string[], actionItems: string[] }`;

        const { data } = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    summary: { type: 'string' },
                    keyPoints: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    actionItems: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                }
            }
        });

        return Response.json({
            summary: data.summary || '',
            keyPoints: data.keyPoints || [],
            actionItems: data.actionItems || []
        });
    } catch (error) {
        console.error('Error summarizing thread:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});