import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { freelancer_id, template_id, custom_subject, custom_body } = await req.json();

        if (!freelancer_id) {
            return Response.json({ error: 'freelancer_id is required' }, { status: 400 });
        }

        // Fetch freelancer
        const freelancers = await base44.entities.Freelancer.filter({ id: freelancer_id });
        if (!freelancers || freelancers.length === 0) {
            return Response.json({ error: 'Freelancer not found' }, { status: 404 });
        }
        const freelancer = freelancers[0];

        let subject, body;

        if (template_id) {
            // Use template
            const templates = await base44.entities.EmailTemplate.filter({ id: template_id });
            if (!templates || templates.length === 0) {
                return Response.json({ error: 'Template not found' }, { status: 404 });
            }
            const template = templates[0];
            subject = template.subject;
            body = template.body;
        } else if (custom_subject && custom_body) {
            // Use custom email
            subject = custom_subject;
            body = custom_body;
        } else {
            return Response.json({ 
                error: 'Either template_id or custom_subject + custom_body required' 
            }, { status: 400 });
        }

        // Replace placeholders
        subject = replacePlaceholders(subject, freelancer);
        body = replacePlaceholders(body, freelancer);

        // Send email
        await base44.integrations.Core.SendEmail({
            to: freelancer.email,
            subject: subject,
            body: body
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