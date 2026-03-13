import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694868412332f081649b2833/6654b10be_elturco_logo-01.png";

function replacePlaceholders(text, freelancer) {
    if (!text) return '';
    let result = text;
    result = result.replace(/\{\{name\}\}/g, freelancer.full_name || '');
    result = result.replace(/\{\{full_name\}\}/g, freelancer.full_name || '');
    result = result.replace(/\{\{email\}\}/g, freelancer.email || '');
    result = result.replace(/\{\{phone\}\}/g, freelancer.phone || '');
    result = result.replace(/\{\{location\}\}/g, freelancer.location || '');
    result = result.replace(/\{\{status\}\}/g, freelancer.status || '');
    result = result.replace(/\{\{experience_years\}\}/g, freelancer.experience_years || '0');
    const languagePairs = freelancer.language_pairs?.map(p => `${p.source_language} → ${p.target_language}`).join(', ') || 'Not specified';
    result = result.replace(/\{\{language_pairs\}\}/g, languagePairs);
    result = result.replace(/\{\{native_language\}\}/g, freelancer.native_language || 'Not specified');
    const specializations = freelancer.specializations?.join(', ') || 'Not specified';
    result = result.replace(/\{\{specializations\}\}/g, specializations);
    const serviceTypes = freelancer.service_types?.join(', ') || 'Not specified';
    result = result.replace(/\{\{service_types\}\}/g, serviceTypes);
    return result;
}

function buildEmailHtml(subject, bodyContent, design, options = {}) {
    const colors = {
        modern: { primary: '#7C3AED', accent: '#EC4899', gradient: 'linear-gradient(135deg, #7C3AED, #EC4899)' },
        minimal: { primary: '#1F2937', accent: '#3B82F6', gradient: 'linear-gradient(135deg, #1F2937, #3B82F6)' },
        vibrant: { primary: '#059669', accent: '#F59E0B', gradient: 'linear-gradient(135deg, #059669, #F59E0B)' },
        corporate: { primary: '#1E40AF', accent: '#64748B', gradient: 'linear-gradient(135deg, #1E40AF, #64748B)' },
    };
    const c = colors[design] || colors.modern;
    const footerText = options.footer_text || '© 2025 el turco. All rights reserved.';
    const buttonText = options.button_text || '';
    const buttonUrl = options.button_url || '#';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table role="presentation" width="100%" style="background-color:#f4f4f5;">
<tr><td style="padding:40px 20px;">
<table role="presentation" width="600" style="margin:0 auto;max-width:600px;">

<!-- Header -->
<tr><td style="background:${c.gradient};border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
<img src="${LOGO_URL}" alt="el turco" style="max-height:60px;" />
</td></tr>

<!-- Body -->
<tr><td style="background-color:#ffffff;padding:40px 40px 32px;">
<div style="color:#374151;font-size:16px;line-height:1.7;">
${bodyContent}
</div>
${buttonText ? `
<table role="presentation" style="margin:28px auto 0;">
<tr><td style="border-radius:50px;background-color:${c.primary};">
<a href="${buttonUrl}" target="_blank" style="display:inline-block;padding:14px 36px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">${buttonText}</a>
</td></tr>
</table>` : ''}
</td></tr>

<!-- Footer -->
<tr><td style="background-color:#f9fafb;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
<p style="color:#6b7280;font-size:12px;margin:0 0 8px;">${footerText}</p>
<p style="color:#9ca3af;font-size:11px;margin:0;">Sent by el turco Freelancer Portal</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

async function sendEmail(to, subject, html) {
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: 'el turco <onboarding@resend.dev>',
            to: [to],
            subject,
            html,
        }),
    });
    const data = await res.json();
    if (!res.ok) {
        console.error('Resend error:', data);
    }
    return data;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        
        const { event, data, old_data } = body;

        // Only process updates where status changed
        if (event?.type !== 'update') {
            return Response.json({ skipped: true, reason: 'not an update' });
        }

        const newStatus = data?.status;
        const oldStatus = old_data?.status;

        if (!newStatus || newStatus === oldStatus) {
            return Response.json({ skipped: true, reason: 'status unchanged' });
        }

        console.log(`Stage change: ${old_data?.full_name} from "${oldStatus}" to "${newStatus}"`);

        // Find matching email templates for this status change
        const templates = await base44.asServiceRole.entities.EmailTemplate.filter({
            trigger_type: 'status_change',
            trigger_status: newStatus,
            is_active: true,
        });

        if (!templates || templates.length === 0) {
            console.log(`No email template found for status: ${newStatus}`);
            return Response.json({ skipped: true, reason: `no template for status ${newStatus}` });
        }

        const freelancer = data;
        const results = [];

        for (const template of templates) {
            const subject = replacePlaceholders(template.subject, freelancer);
            const bodyContent = replacePlaceholders(template.body, freelancer);
            const design = template.design_template || 'modern';

            const html = buildEmailHtml(subject, bodyContent, design, {
                footer_text: template.footer_text,
                button_text: template.button_text ? replacePlaceholders(template.button_text, freelancer) : '',
                button_url: template.button_url || '',
            });

            const result = await sendEmail(freelancer.email, subject, html);
            results.push({ template: template.name, email: freelancer.email, result });

            // Log activity
            await base44.asServiceRole.entities.FreelancerActivity.create({
                freelancer_id: freelancer.id,
                activity_type: 'Email Sent',
                description: `Auto email "${template.name}" sent on stage change to "${newStatus}"`,
                performed_by: 'system',
            });
        }

        return Response.json({ success: true, emails_sent: results.length, results });
    } catch (error) {
        console.error('Stage change email error:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});