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
        const base44Role = role === 'admin' ? 'admin' : 'user';

        console.log('Inviting user:', email, 'with base44 role:', base44Role, '(requested app role:', role, ')');
        
        try {
            // Step 1: Send the invitation
            const result = await base44.asServiceRole.users.inviteUser(email, base44Role);
            console.log('Invite result:', result);
            
            // Step 2: Store the pending role assignment for non-standard roles
            if (role === 'project_manager') {
                // Check if there's already a pending assignment for this email
                const existingAssignments = await base44.asServiceRole.entities.PendingRoleAssignment.filter({ 
                    email: email.toLowerCase(),
                    applied: false 
                });
                
                if (existingAssignments.length === 0) {
                    await base44.asServiceRole.entities.PendingRoleAssignment.create({
                        email: email.toLowerCase(),
                        requested_role: role,
                        invited_by: user.email,
                        applied: false
                    });
                    console.log('Created pending role assignment for:', email, 'role:', role);
                } else {
                    // Update existing assignment
                    await base44.asServiceRole.entities.PendingRoleAssignment.update(
                        existingAssignments[0].id,
                        { requested_role: role, invited_by: user.email }
                    );
                    console.log('Updated pending role assignment for:', email);
                }
            }
            
            return Response.json({ 
                success: true, 
                message: 'Invitation sent successfully', 
                requestedRole: role
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