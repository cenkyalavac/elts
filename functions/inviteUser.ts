import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { email, role } = await req.json();

        if (!email || !role) {
            return Response.json({ error: 'Email and role are required' }, { status: 400 });
        }

        if (!['admin', 'project_manager'].includes(role)) {
            return Response.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Invite the user (platform will send invitation email)
        await base44.asServiceRole.integrations.Core.SendEmail({
            to: email,
            subject: 'You have been invited to el turco portal',
            body: `You have been invited to join the el turco portal as a ${role === 'admin' ? 'Administrator' : 'Project Manager'}.\n\nPlease visit the app to accept the invitation.`
        });

        return Response.json({ success: true, message: 'Invitation sent' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});