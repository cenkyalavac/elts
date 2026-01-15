import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const EMAIL_DESIGNS = {
    modern: {
        primaryColor: '#7C3AED',
        accentColor: '#EC4899',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    minimal: {
        primaryColor: '#1F2937',
        accentColor: '#3B82F6',
        fontFamily: "'Helvetica Neue', Arial, sans-serif"
    },
    vibrant: {
        primaryColor: '#059669',
        accentColor: '#F59E0B',
        fontFamily: "'Poppins', 'Segoe UI', sans-serif"
    },
    corporate: {
        primaryColor: '#1E40AF',
        accentColor: '#64748B',
        fontFamily: "'Georgia', 'Times New Roman', serif"
    }
};

const replacePlaceholders = (text, freelancer) => {
    if (!text) return '';
    
    let result = text;
    
    // Basic fields
    result = result.replace(/\{\{name\}\}/g, freelancer.full_name || '');
    result = result.replace(/\{\{full_name\}\}/g, freelancer.full_name || '');
    result = result.replace(/\{\{email\}\}/g, freelancer.email || '');
    result = result.replace(/\{\{phone\}\}/g, freelancer.phone || '');
    result = result.replace(/\{\{location\}\}/g, freelancer.location || '');
    result = result.replace(/\{\{status\}\}/g, freelancer.status || '');
    result = result.replace(/\{\{experience_years\}\}/g, freelancer.experience_years || '0');
    
    // Language pairs
    const languagePairs = freelancer.language_pairs?.map(p => 
        `${p.source_language} → ${p.target_language}`
    ).join(', ') || 'Not specified';
    result = result.replace(/\{\{language_pairs\}\}/g, languagePairs);
    
    // Native language
    result = result.replace(/\{\{native_language\}\}/g, freelancer.native_language || 'Not specified');
    
    // Specializations
    const specializations = freelancer.specializations?.join(', ') || 'Not specified';
    result = result.replace(/\{\{specializations\}\}/g, specializations);
    
    // Service types
    const serviceTypes = freelancer.service_types?.join(', ') || 'Not specified';
    result = result.replace(/\{\{service_types\}\}/g, serviceTypes);
    
    // Skills
    const skills = freelancer.skills?.join(', ') || 'Not specified';
    result = result.replace(/\{\{skills\}\}/g, skills);
    
    return result;
};

const generateHtmlEmail = (template, bodyContent, freelancer) => {
    const design = EMAIL_DESIGNS[template.design_template] || EMAIL_DESIGNS.modern;
    const headerImageUrl = template.header_image_url;
    const footerText = template.footer_text || '© 2024 el turco. All rights reserved.';
    const buttonText = template.button_text;
    const buttonUrl = template.button_url;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.subject || 'Email'}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: ${design.fontFamily};">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; max-width: 600px;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, ${design.primaryColor}, ${design.accentColor}); border-radius: 16px 16px 0 0; padding: 30px 40px; text-align: center;">
                            ${headerImageUrl ? 
                                `<img src="${headerImageUrl}" alt="Logo" style="max-height: 50px; margin-bottom: 10px;">` :
                                `<h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">el turco</h1>`
                            }
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="background-color: #ffffff; padding: 40px;">
                            <div style="color: #374151; font-size: 16px; line-height: 1.6;">
                                ${bodyContent}
                            </div>
                            
                            ${buttonText ? `
                            <!-- CTA Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px auto;">
                                <tr>
                                    <td style="border-radius: 50px; background-color: ${design.primaryColor};">
                                        <a href="${buttonUrl || '#'}" target="_blank" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                                            ${buttonText}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; border-radius: 0 0 16px 16px; padding: 24px 40px; text-align: center;">
                            <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
                                ${footerText}
                            </p>
                            <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                                This email was sent to ${freelancer.email}
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
};

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { freelancer_id, template_id, custom_subject, custom_body, attachment_urls } = await req.json();

        if (!freelancer_id) {
            return Response.json({ error: 'freelancer_id is required' }, { status: 400 });
        }

        // Fetch freelancer
        const freelancers = await base44.entities.Freelancer.filter({ id: freelancer_id });
        if (!freelancers || freelancers.length === 0) {
            return Response.json({ error: 'Freelancer not found' }, { status: 404 });
        }
        const freelancer = freelancers[0];

        let subject, body, template = {};

        if (template_id) {
            // Use template
            const templates = await base44.entities.EmailTemplate.filter({ id: template_id });
            if (!templates || templates.length === 0) {
                return Response.json({ error: 'Template not found' }, { status: 404 });
            }
            template = templates[0];
            subject = template.subject;
            body = template.body;
        } else if (custom_subject && custom_body) {
            // Use custom email with default design
            subject = custom_subject;
            body = custom_body;
            template = { design_template: 'modern' };
        } else {
            return Response.json({ 
                error: 'Either template_id or custom_subject + custom_body required' 
            }, { status: 400 });
        }

        // Replace placeholders
        subject = replacePlaceholders(subject, freelancer);
        body = replacePlaceholders(body, freelancer);

        // Add attachments if provided
        if (attachment_urls && attachment_urls.length > 0) {
            let attachmentSection = '<br/><br/><p style="font-weight: 600; color: #374151;">📎 Attachments:</p>';
            attachment_urls.forEach((url, index) => {
                const filename = url.split('/').pop() || `attachment_${index + 1}`;
                attachmentSection += `<p><a href="${url}" style="color: ${EMAIL_DESIGNS[template.design_template || 'modern'].primaryColor}; text-decoration: none;">📄 ${filename}</a></p>`;
            });
            body = body + attachmentSection;
        }

        // Generate beautiful HTML email
        const htmlBody = generateHtmlEmail(template, body, freelancer);

        // Send email
        await base44.integrations.Core.SendEmail({
            to: freelancer.email,
            subject: subject,
            body: htmlBody
        });

        return Response.json({ 
            success: true,
            message: 'Email sent successfully'
        });

    } catch (error) {
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});