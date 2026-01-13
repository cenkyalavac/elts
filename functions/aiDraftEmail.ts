import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { emailContent, subject, freelancerProfile, userEmail } = await req.json();

        const prompt = `You are a professional email assistant. Generate 3 different response options to this email.

Email Subject: ${subject}
Email Content: ${emailContent}

Freelancer Profile:
- Name: ${freelancerProfile?.name || 'Not provided'}
- Email: ${freelancerProfile?.email || 'Not provided'}
- Status: ${freelancerProfile?.status || 'Not provided'}
- Languages: ${freelancerProfile?.languages?.map(l => `${l.source_language} → ${l.target_language}`).join(', ') || 'Not provided'}
- Specializations: ${freelancerProfile?.specializations?.join(', ') || 'Not provided'}

Generate 3 response options with different tones:
1. A professional/formal response
2. A friendly/collaborative response
3. A brief/direct response

For each option, include:
- The tone used
- The response text (2-3 paragraphs)

Format as JSON with array of objects: { tone: string, content: string }`;

        const { data } = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    drafts: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                tone: { type: 'string' },
                                content: { type: 'string' }
                            }
                        }
                    }
                }
            }
        });

        return Response.json({
            drafts: data.drafts || []
        });
    } catch (error) {
        console.error('Error drafting email:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});