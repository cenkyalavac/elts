import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { to, subject, html, from_name, reply_to, is_service_call } = await req.json();

        // Allow service-role calls (from automations) or authenticated user calls
        if (!is_service_call) {
            const user = await base44.auth.me();
            if (!user) {
                return Response.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        if (!to || !subject || !html) {
            return Response.json({ error: 'to, subject, and html are required' }, { status: 400 });
        }

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `${from_name || 'el turco'} <onboarding@resend.dev>`,
                to: Array.isArray(to) ? to : [to],
                subject,
                html,
                ...(reply_to ? { reply_to } : {}),
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Resend error:', result);
            return Response.json({ success: false, error: result }, { status: response.status });
        }

        return Response.json({ success: true, id: result.id });
    } catch (error) {
        console.error('Send email error:', error.message);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});