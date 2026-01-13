import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { email } = await req.json();

        if (!email) {
            return Response.json({ error: 'Email is required' }, { status: 400 });
        }

        const emailContent = `
Subject: ${email.subject}
From: ${email.from}
Body: ${email.body || ''}
Attachments: ${email.attachments?.length || 0}
        `.trim();

        const analysis = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze this email and provide a JSON response with the following fields:
- category: One of ["Application", "Support Request", "Notification", "Job Inquiry", "Follow-up", "Other"]
- urgency: One of ["high", "medium", "low"]
- is_spam: boolean (true if this appears to be spam or unwanted)
- confidence: number between 0 and 1
- draft_reply: A brief, professional draft reply if appropriate (null if no reply needed)
- key_points: Array of 2-3 main points from the email
- action_needed: Brief description of what action should be taken (null if none)

Email to analyze:
${emailContent}

Respond with ONLY valid JSON, no additional text.`,
            response_json_schema: {
                type: 'object',
                properties: {
                    category: { type: 'string' },
                    urgency: { type: 'string' },
                    is_spam: { type: 'boolean' },
                    confidence: { type: 'number' },
                    draft_reply: { type: ['string', 'null'] },
                    key_points: { type: 'array', items: { type: 'string' } },
                    action_needed: { type: ['string', 'null'] }
                }
            }
        });

        return Response.json({
            success: true,
            analysis: analysis
        });
    } catch (error) {
        console.error('Error analyzing email:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});