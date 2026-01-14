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

        // Map custom roles to base44 roles (admin or user)
        // project_manager and applicant map to 'user' role
        const base44Role = role === 'admin' ? 'admin' : 'user';

        // Invite the user using Base44's built-in invitation system
        console.log('Inviting user:', email, 'with base44 role:', base44Role, '(requested:', role, ')');
        
        try {
            const result = await base44.users.inviteUser(email, base44Role);
            console.log('Invite result:', result);
            return Response.json({ success: true, message: 'Invitation sent successfully', requestedRole: role });
        } catch (inviteError) {
            console.error('Error from inviteUser:', inviteError);
            return Response.json({ error: 'Failed to send invitation: ' + inviteError.message }, { status: 500 });
        }
    } catch (error) {
        console.error('Top level error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});