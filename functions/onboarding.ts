import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Email Templates
const WELCOME_EMAIL_TEMPLATE = (fullName) => `
<h1>Welcome, ${fullName}!</h1>
<p>Thank you for applying to join our freelancer network. We have received your application and our team will review it shortly.</p>
<p>You can track your application status and complete your onboarding checklist by logging into your dashboard.</p>
<br>
<p>Best regards,</p>
<p>The El Turco Team</p>
`.trim();

const NEW_APPLICATION_ADMIN_TEMPLATE = (fullName, email, serviceTypes) => `
<h2>New Application Received</h2>
<p><strong>Name:</strong> ${fullName}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Services:</strong> ${serviceTypes}</p>
<p>Please review their application in the dashboard.</p>
`.trim();

const PROFILE_UPDATE_ADMIN_TEMPLATE = (fullName, updateType) => `
<h2>Freelancer Profile Updated</h2>
<p><strong>Name:</strong> ${fullName}</p>
<p><strong>Update:</strong> ${updateType}</p>
<p>Please review the uploaded documents or changes in the dashboard.</p>
`.trim();

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
                body: WELCOME_EMAIL_TEMPLATE(freelancer.full_name)
            });
            
            const admins = await base44.entities.User.filter({ role: 'admin' });
            if (admins.length > 0) {
                await base44.integrations.Core.SendEmail({
                    to: admins[0].email,
                    subject: "New Freelancer Application",
                    body: NEW_APPLICATION_ADMIN_TEMPLATE(
                        freelancer.full_name,
                        freelancer.email,
                        freelancer.service_types?.join(', ') || 'Not specified'
                    )
                });
            }

            return Response.json({ success: true });
        }

        if (action === 'notifyAdminOfUpdate') {
            const freelancer = await base44.entities.Freelancer.get(freelancerId);
            const admins = await base44.entities.User.filter({ role: 'admin' });
            
            if (admins.length > 0) {
                await base44.integrations.Core.SendEmail({
                    to: admins[0].email,
                    subject: `Freelancer Update: ${freelancer.full_name}`,
                    body: PROFILE_UPDATE_ADMIN_TEMPLATE(freelancer.full_name, updateType)
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