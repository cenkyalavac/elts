import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Smartcat API base URL - correct endpoint
const SMARTCAT_API_URL = 'https://smartcat.com/api/integration/v1';

async function getSmartcatAuth() {
    const accountId = Deno.env.get('SMARTCAT_ACCOUNT_ID');
    const apiKey = Deno.env.get('SMARTCAT_API_KEY');
    return 'Basic ' + btoa(`${accountId}:${apiKey}`);
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || (user.role !== 'admin' && user.role !== 'project_manager')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, filters, freelancer_id } = await req.json();
        const auth = await getSmartcatAuth();

        if (action === 'search_marketplace') {
            // Smartcat doesn't have public marketplace API
            // Return suggestion to use website
            return Response.json({ 
                error: 'Marketplace search API not available',
                suggestion: 'Use manual search on Smartcat website and invite via email',
                freelancers: []
            });
        }

        if (action === 'get_my_team') {
            // Get freelancers from Smartcat account
            // Try multiple endpoints as Smartcat API varies
            
            // Try getting users from account
            let team = [];
            
            try {
                // Get account info first
                const accountResponse = await fetch(`${SMARTCAT_API_URL}/account`, {
                    headers: { 'Authorization': auth }
                });
                
                if (accountResponse.ok) {
                    const accountData = await accountResponse.json();
                    console.log('Account data:', JSON.stringify(accountData));
                }
            } catch (e) {
                console.log('Account fetch error:', e.message);
            }

            // Try to get translators from projects
            try {
                const projectsResponse = await fetch(`${SMARTCAT_API_URL}/project/list`, {
                    headers: { 'Authorization': auth }
                });
                
                if (projectsResponse.ok) {
                    const projects = await projectsResponse.json();
                    const assigneeSet = new Map();
                    
                    // Extract unique assignees from projects
                    for (const project of projects.slice(0, 50)) { // Limit to recent 50
                        if (project.assignees) {
                            for (const assignee of project.assignees) {
                                if (assignee.email && !assigneeSet.has(assignee.email.toLowerCase())) {
                                    assigneeSet.set(assignee.email.toLowerCase(), {
                                        email: assignee.email,
                                        name: assignee.name || assignee.supplierName || assignee.email.split('@')[0],
                                        id: assignee.id || assignee.userId
                                    });
                                }
                            }
                        }
                        if (project.executives) {
                            for (const exec of project.executives) {
                                if (exec.email && !assigneeSet.has(exec.email.toLowerCase())) {
                                    assigneeSet.set(exec.email.toLowerCase(), {
                                        email: exec.email,
                                        name: exec.name || exec.supplierName || exec.email.split('@')[0],
                                        id: exec.id || exec.userId
                                    });
                                }
                            }
                        }
                    }
                    
                    team = Array.from(assigneeSet.values());
                }
            } catch (e) {
                console.log('Projects fetch error:', e.message);
            }

            // If we got team members, return them
            if (team.length > 0) {
                return Response.json({ team, total: team.length, source: 'projects' });
            }

            // Fallback: return error with details
            return Response.json({ 
                error: 'Could not fetch team from Smartcat',
                details: 'Try checking your API credentials or Smartcat API access',
                team: [],
                total: 0
            });
        }

        if (action === 'invite_to_team') {
            const { email, name, message } = filters || {};
            
            if (!email) {
                return Response.json({ error: 'Email required' }, { status: 400 });
            }

            // Create/update in Base44
            const existingFreelancers = await base44.asServiceRole.entities.Freelancer.filter({ email });
            
            if (existingFreelancers.length === 0) {
                await base44.asServiceRole.entities.Freelancer.create({
                    email,
                    full_name: name || email.split('@')[0],
                    status: 'New Application',
                    tags: ['Smartcat Invite', 'Invited'],
                    notes: `Invited to Smartcat team on ${new Date().toISOString().split('T')[0]}`
                });
            } else {
                const existing = existingFreelancers[0];
                const currentTags = existing.tags || [];
                if (!currentTags.includes('Smartcat Invite')) {
                    await base44.asServiceRole.entities.Freelancer.update(existing.id, {
                        tags: [...currentTags, 'Smartcat Invite', 'Invited']
                    });
                }
            }

            // Send welcome email
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: email,
                subject: 'Invitation to Join el turco Team',
                body: `
Hello${name ? ' ' + name : ''},

We've reviewed your profile and would like to invite you to join our team.

At el turco, we provide professional translation services and enjoy working with talented translators.

${message || 'By joining our team, you can benefit from regular work opportunities and lower commission rates.'}

Please accept our invitation on Smartcat to join the team.

If you have any questions, feel free to reply to this email.

Best regards,
el turco Team
                `.trim()
            });

            return Response.json({ 
                success: true, 
                message: 'Invitation email sent. Please also invite via Smartcat dashboard.',
                note: 'Manual Smartcat invitation required'
            });
        }

        if (action === 'sync_team_to_base44') {
            // First get team from projects
            let team = [];
            
            try {
                const projectsResponse = await fetch(`${SMARTCAT_API_URL}/project/list`, {
                    headers: { 'Authorization': auth }
                });
                
                if (projectsResponse.ok) {
                    const projects = await projectsResponse.json();
                    const assigneeSet = new Map();
                    
                    for (const project of projects) {
                        if (project.assignees) {
                            for (const assignee of project.assignees) {
                                if (assignee.email && !assigneeSet.has(assignee.email.toLowerCase())) {
                                    assigneeSet.set(assignee.email.toLowerCase(), {
                                        email: assignee.email,
                                        name: assignee.name || assignee.supplierName || assignee.email.split('@')[0],
                                        id: assignee.id
                                    });
                                }
                            }
                        }
                    }
                    
                    team = Array.from(assigneeSet.values());
                }
            } catch (e) {
                return Response.json({ error: 'Failed to fetch from Smartcat: ' + e.message }, { status: 400 });
            }

            if (team.length === 0) {
                return Response.json({ 
                    success: true, 
                    team_size: 0,
                    created: 0,
                    updated: 0,
                    message: 'No team members found in Smartcat projects'
                });
            }

            const existingFreelancers = await base44.asServiceRole.entities.Freelancer.list();
            const existingEmails = new Set(existingFreelancers.map(f => f.email?.toLowerCase()));

            let created = 0;
            let updated = 0;

            for (const member of team) {
                const email = member.email?.toLowerCase();
                if (!email) continue;

                if (!existingEmails.has(email)) {
                    await base44.asServiceRole.entities.Freelancer.create({
                        email: member.email,
                        full_name: member.name,
                        status: 'Approved',
                        tags: ['Smartcat Team'],
                        notes: `Synced from Smartcat on ${new Date().toISOString().split('T')[0]}`
                    });
                    created++;
                } else {
                    const existing = existingFreelancers.find(f => f.email?.toLowerCase() === email);
                    if (existing && !existing.tags?.includes('Smartcat Team')) {
                        await base44.asServiceRole.entities.Freelancer.update(existing.id, {
                            tags: [...(existing.tags || []), 'Smartcat Team']
                        });
                        updated++;
                    }
                }
            }

            return Response.json({ 
                success: true, 
                team_size: team.length,
                created,
                updated
            });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});