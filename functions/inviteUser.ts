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

        // For Base44's inviteUser, we can only use 'admin' or 'user'
        // For admin role, use 'admin'; for project_manager, use 'admin' as well 
        // (since project managers need elevated access), then we'll set custom role after
        const base44Role = role === 'admin' ? 'admin' : 'user';

        console.log('Inviting user:', email, 'with base44 role:', base44Role, '(requested app role:', role, ')');
        
        try {
            // Step 1: Send the invitation
            const result = await base44.asServiceRole.users.inviteUser(email, base44Role);
            console.log('Invite result:', result);
            
            // Step 2: If the requested role is project_manager, we need to update them after they register
            // Store the pending role assignment - we'll check this when they log in
            // For now, return success with info about the role
            return Response.json({ 
                success: true, 
                message: 'Invitation sent successfully', 
                requestedRole: role,
                note: role === 'project_manager' ? 'User will need role updated to project_manager after registration' : null
            });
        } catch (inviteError) {
            console.error('Error from inviteUser:', inviteError);
            
            // Check if user already exists
            if (inviteError.message?.includes('already exists') || inviteError.message?.includes('already registered')) {
                return Response.json({ 
                    error: 'User with this email already exists. Update their role from the user list instead.' 
                }, { status: 400 });
            }
            
            return Response.json({ error: 'Failed to send invitation: ' + inviteError.message }, { status: 500 });
        }
    } catch (error) {
        console.error('Top level error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});