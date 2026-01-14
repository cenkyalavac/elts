import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const accessToken = await base44.asServiceRole.connectors.getAccessToken('linkedin');

        // Get the user's profile to get their person URN
        const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            }
        });

        if (!profileResponse.ok) {
            const error = await profileResponse.text();
            console.log('Profile error:', error);
            return Response.json({ error: 'Failed to get LinkedIn profile' }, { status: 500 });
        }

        const profile = await profileResponse.json();
        console.log('LinkedIn profile:', profile);

        // Get organizations the user administers
        const orgsResponse = await fetch(
            'https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName,vanityName,logoV2(original~:playableStreams))))',
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Restli-Protocol-Version': '2.0.0',
                }
            }
        );

        if (!orgsResponse.ok) {
            const error = await orgsResponse.text();
            console.log('Organizations error:', error);
            // Return empty array if no admin access to any organizations
            return Response.json({ companies: [], profile: { name: profile.name, sub: profile.sub } });
        }

        const orgsData = await orgsResponse.json();
        console.log('Organizations data:', JSON.stringify(orgsData));

        const companies = (orgsData.elements || []).map(element => {
            const org = element['organization~'] || {};
            return {
                id: org.id,
                urn: element.organization,
                name: org.localizedName,
                vanityName: org.vanityName,
                logo: org.logoV2?.['original~']?.elements?.[0]?.identifiers?.[0]?.identifier
            };
        });

        return Response.json({ 
            companies,
            profile: { name: profile.name, sub: profile.sub }
        });

    } catch (error) {
        console.error('Error fetching LinkedIn companies:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});