import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SMARTCAT_API_URL = 'https://smartcat.com/api/integration/v2';

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
            // Search for freelancers in Smartcat marketplace
            const { source_language, target_language, specialization, min_rate, max_rate } = filters || {};
            
            let url = `${SMARTCAT_API_URL}/freelancers/search?`;
            const params = new URLSearchParams();
            
            if (source_language) params.append('sourceLanguage', source_language);
            if (target_language) params.append('targetLanguage', target_language);
            if (specialization) params.append('specialization', specialization);
            
            const response = await fetch(url + params.toString(), {
                headers: { 'Authorization': auth }
            });

            if (!response.ok) {
                // Try alternative endpoint
                const altResponse = await fetch(`${SMARTCAT_API_URL}/account/searchMyTeam?${params.toString()}`, {
                    headers: { 'Authorization': auth }
                });
                
                if (!altResponse.ok) {
                    return Response.json({ 
                        error: 'Marketplace search not available',
                        suggestion: 'Use manual search on Smartcat website'
                    }, { status: 400 });
                }
                
                const teamData = await altResponse.json();
                return Response.json({ freelancers: teamData, source: 'team' });
            }

            const freelancers = await response.json();
            
            // Filter by rate if specified
            let filtered = freelancers;
            if (min_rate || max_rate) {
                filtered = freelancers.filter(f => {
                    const rate = f.rate || f.pricePerWord || 0;
                    if (min_rate && rate < min_rate) return false;
                    if (max_rate && rate > max_rate) return false;
                    return true;
                });
            }

            return Response.json({ 
                freelancers: filtered,
                total: filtered.length,
                source: 'marketplace'
            });
        }

        if (action === 'get_my_team') {
            // Get freelancers already in our Smartcat team
            const response = await fetch(`${SMARTCAT_API_URL}/account/myTeam`, {
                headers: { 'Authorization': auth }
            });

            if (!response.ok) {
                const errorText = await response.text();
                return Response.json({ error: 'Failed to get team', details: errorText }, { status: 400 });
            }

            const team = await response.json();
            return Response.json({ team, total: team.length });
        }

        if (action === 'invite_to_team') {
            // Invite a marketplace freelancer to our team
            const { email, name, message } = filters || {};
            
            if (!email) {
                return Response.json({ error: 'Email required' }, { status: 400 });
            }

            // Send invitation via Smartcat API
            const response = await fetch(`${SMARTCAT_API_URL}/account/inviteUser`, {
                method: 'POST',
                headers: { 
                    'Authorization': auth,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    externalId: `base44_${Date.now()}`,
                    rightsGroup: 'Freelancer'
                })
            });

            // Also create/update in Base44
            const existingFreelancers = await base44.asServiceRole.entities.Freelancer.filter({ email });
            
            if (existingFreelancers.length === 0) {
                await base44.asServiceRole.entities.Freelancer.create({
                    email,
                    full_name: name || email.split('@')[0],
                    status: 'New Application',
                    tags: ['Smartcat Marketplace', 'Invited'],
                    notes: `Smartcat marketplace'ten davet edildi. ${new Date().toLocaleDateString('tr-TR')}`
                });
            } else {
                const existing = existingFreelancers[0];
                const currentTags = existing.tags || [];
                if (!currentTags.includes('Smartcat Marketplace')) {
                    await base44.asServiceRole.entities.Freelancer.update(existing.id, {
                        tags: [...currentTags, 'Smartcat Marketplace', 'Invited']
                    });
                }
            }

            // Send welcome email
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: email,
                subject: 'el turco Ekibine Davet',
                body: `
Merhaba${name ? ' ' + name : ''},

Smartcat üzerindeki profilinizi inceledik ve ekibimize katılmanızı çok isteriz.

el turco olarak profesyonel çeviri hizmetleri sunuyoruz ve yetenekli çevirmenlerle çalışmaktan mutluluk duyuyoruz.

${message || 'Ekibimize katılarak düzenli iş fırsatlarından yararlanabilir ve daha düşük komisyon oranlarıyla çalışabilirsiniz.'}

Smartcat üzerinden gönderdiğimiz daveti kabul ederek ekibimize katılabilirsiniz.

Sorularınız için bu e-postayı yanıtlayabilirsiniz.

Saygılarımızla,
el turco Ekibi
                `.trim()
            });

            return Response.json({ 
                success: true, 
                message: 'Invitation sent',
                smartcat_response: response.ok ? 'success' : 'pending'
            });
        }

        if (action === 'sync_team_to_base44') {
            // Sync all Smartcat team members to Base44
            const response = await fetch(`${SMARTCAT_API_URL}/account/myTeam`, {
                headers: { 'Authorization': auth }
            });

            if (!response.ok) {
                return Response.json({ error: 'Failed to get team' }, { status: 400 });
            }

            const team = await response.json();
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
                        full_name: member.name || member.firstName + ' ' + member.lastName,
                        status: 'Approved',
                        tags: ['Smartcat Team'],
                        notes: `Smartcat'ten senkronize edildi. ID: ${member.id || member.externalId}`
                    });
                    created++;
                } else {
                    // Update existing with Smartcat ID if not present
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