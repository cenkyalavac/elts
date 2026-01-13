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

        if (!['admin', 'user'].includes(role)) {
            return Response.json({ error: 'Invalid role - must be admin or user' }, { status: 400 });
        }

        // Invite the user using Base44's built-in invitation system
        console.log('Inviting user:', email, 'with role:', role);
        const result = await base44.users.inviteUser(email, role);
        console.log('Invite result:', result);

        return Response.json({ success: true, message: 'Invitation sent successfully' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});