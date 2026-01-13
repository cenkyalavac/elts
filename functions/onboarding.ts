import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { action, freelancerId, updateType } = await req.json();

        if (action === 'sendWelcomeEmail') {
            const freelancer = await base44.entities.Freelancer.get(freelancerId);
            
            // Send welcome email to freelancer
            await base44.integrations.Core.SendEmail({
                to: freelancer.email,
                subject: "Welcome to El Turco - Application Received",
                body: `
                    <h1>Welcome, ${freelancer.full_name}!</h1>
                    <p>Thank you for applying to join our freelancer network. We have received your application and our team will review it shortly.</p>
                    <p>You can track your application status and complete your onboarding checklist by logging into your dashboard.</p>
                    <br>
                    <p>Best regards,</p>
                    <p>The El Turco Team</p>
                `
            });
            
            // Notify admins of new application
            // Ideally we'd loop through admin users, but for now sending to a generic admin email or first admin
            const admins = await base44.entities.User.filter({ role: 'admin' });
            if (admins.length > 0) {
                // Send to the first admin found, or a shared inbox if configured
                await base44.integrations.Core.SendEmail({
                    to: admins[0].email,
                    subject: "New Freelancer Application",
                    body: `
                        <h2>New Application Received</h2>
                        <p><strong>Name:</strong> ${freelancer.full_name}</p>
                        <p><strong>Email:</strong> ${freelancer.email}</p>
                        <p><strong>Services:</strong> ${freelancer.service_types?.join(', ')}</p>
                        <p>Please review their application in the dashboard.</p>
                    `
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
                    body: `
                        <h2>Freelancer Profile Updated</h2>
                        <p><strong>Name:</strong> ${freelancer.full_name}</p>
                        <p><strong>Update:</strong> ${updateType}</p>
                        <p>Please review the uploaded documents or changes in the dashboard.</p>
                    `
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