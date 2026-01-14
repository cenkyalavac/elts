import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const userEmail = user.email.toLowerCase();
        console.log('Checking pending role for:', userEmail);

        // Check for pending role assignments
        const pendingAssignments = await base44.asServiceRole.entities.PendingRoleAssignment.filter({
            email: userEmail,
            applied: false
        });

        if (pendingAssignments.length === 0) {
            console.log('No pending role assignment found for:', userEmail);
            return Response.json({ applied: false, message: 'No pending role assignment' });
        }

        const assignment = pendingAssignments[0];
        console.log('Found pending assignment:', assignment);

        // Apply the role to the user
        try {
            // Get the user record to update
            const users = await base44.asServiceRole.entities.User.filter({ email: user.email });
            
            if (users.length > 0) {
                const userRecord = users[0];
                
                // Only update if role is different
                if (userRecord.role !== assignment.requested_role) {
                    await base44.asServiceRole.entities.User.update(userRecord.id, {
                        role: assignment.requested_role
                    });
                    console.log('Updated user role to:', assignment.requested_role);
                }
            }

            // Mark the assignment as applied
            await base44.asServiceRole.entities.PendingRoleAssignment.update(assignment.id, {
                applied: true
            });

            return Response.json({ 
                applied: true, 
                role: assignment.requested_role,
                message: `Role updated to ${assignment.requested_role}` 
            });
        } catch (updateError) {
            console.error('Error applying role:', updateError);
            return Response.json({ error: 'Failed to apply role: ' + updateError.message }, { status: 500 });
        }
    } catch (error) {
        console.error('Error in applyPendingRole:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});