import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state'); // user ID

        if (!code || !state) {
            return new Response('Missing code or state', { status: 400 });
        }

        const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
        const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
        const redirectUri = `${new URL(req.url).origin}/functions/gmailCallback`;

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        });

        const tokens = await tokenResponse.json();

        if (!tokens.refresh_token) {
            return new Response('No refresh token received', { status: 400 });
        }

        // Get user's Gmail email
        const profileResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
            headers: { 'Authorization': `Bearer ${tokens.access_token}` }
        });
        const profile = await profileResponse.json();

        // Update user with refresh token - use service role directly
        const base44 = createClientFromRequest(req);
        await base44.asServiceRole.entities.User.update(state, {
            gmailRefreshToken: tokens.refresh_token,
            gmailEmail: profile.emailAddress
        }, { skipAuth: true });

        // Redirect to app
        return Response.redirect(`${url.origin}/`, 302);

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});