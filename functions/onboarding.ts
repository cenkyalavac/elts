import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Helper function to replace template placeholders
function replaceTemplate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] !== undefined ? data[key] : match;
    });
}

// Helper function to log admin actions
async function logAction(base44, { actorId, actorEmail, actionType, targetEntity, targetId, metadata }) {
    try {
        await base44.asServiceRole.entities.AdminAuditLog.create({
            actor_id: actorId,
            actor_email: actorEmail,
            action_type: actionType,
            target_entity: targetEntity,
            target_id: targetId,
            metadata: metadata
        });
    } catch (error) {
        console.error('Failed to log admin action:', error);
    }
}

// Email Templates with placeholders
const EMAIL_TEMPLATES = {
    WELCOME: `
<h1>Welcome, {{fullName}}!</h1>
<p>Thank you for applying to join our freelancer network. We have received your application and our team will review it shortly.</p>
<p>You can track your application status and complete your onboarding checklist by logging into your dashboard.</p>
<br>
<p>Best regards,</p>
<p>The El Turco Team</p>
`.trim(),

    NEW_APPLICATION_ADMIN: `
<h2>New Application Received</h2>
<p><strong>Name:</strong> {{fullName}}</p>
<p><strong>Email:</strong> {{email}}</p>
<p><strong>Services:</strong> {{serviceTypes}}</p>
<p>Please review their application in the dashboard.</p>
`.trim(),

    PROFILE_UPDATE_ADMIN: `
<h2>Freelancer Profile Updated</h2>
<p><strong>Name:</strong> {{fullName}}</p>
<p><strong>Update:</strong> {{updateType}}</p>
<p>Please review the uploaded documents or changes in the dashboard.</p>
`.trim()
};

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        if (user.role !== 'admin' && user.role !== 'project_manager' && user.role !== 'applicant') {
            return Response.json({ error: 'Forbidden: Access denied' }, { status: 403 });
        }
        
        const { action, freelancerId, updateType } = await req.json();

        if (action === 'sendWelcomeEmail') {
            const freelancer = await base44.entities.Freelancer.get(freelancerId);
            
            await base44.integrations.Core.SendEmail({
                to: freelancer.email,
                subject: "Welcome to El Turco - Application Received",
                body: replaceTemplate(EMAIL_TEMPLATES.WELCOME, { fullName: freelancer.full_name })
            });
            
            const admins = await base44.entities.User.filter({ role: 'admin' });
            if (admins.length > 0) {
                await base44.integrations.Core.SendEmail({
                    to: admins[0].email,
                    subject: "New Freelancer Application",
                    body: replaceTemplate(EMAIL_TEMPLATES.NEW_APPLICATION_ADMIN, {
                        fullName: freelancer.full_name,
                        email: freelancer.email,
                        serviceTypes: freelancer.service_types?.join(', ') || 'Not specified'
                    })
                });
            }

            // Log the action
            await logAction(base44, {
                actorId: user.id,
                actorEmail: user.email,
                actionType: 'STATUS_CHANGE',
                targetEntity: 'Freelancer',
                targetId: freelancerId,
                metadata: { action: 'sendWelcomeEmail', freelancer_name: freelancer.full_name }
            });

            return Response.json({ success: true });
        }

        if (action === 'notifyAdminOfUpdate') {
            const freelancer = await base44.entities.Freelancer.get(freelancerId);
            const admins = await base44.entities.User.filter({ role: 'admin' });
            
            if (admins.length > 0) {
                await base44.integrations.Core.SendEmail({
                    to: admins[0].email,
                    subject: `Freelancer Update: ${freelancer.full_name}`,
                    body: replaceTemplate(EMAIL_TEMPLATES.PROFILE_UPDATE_ADMIN, {
                        fullName: freelancer.full_name,
                        updateType: updateType
                    })
                });
            }
            return Response.json({ success: true });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Error in onboarding function:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});