import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function getAccessToken(refreshToken) {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'refresh_token'
        })
    });

    const data = await response.json();
    return data.access_token;
}

function createRawEmail(to, subject, body, threadId = null) {
    const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        body
    ].join('\r\n');

    const encodedEmail = btoa(email)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return { raw: encodedEmail, threadId };
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || !user.gmailRefreshToken) {
            return Response.json({ error: 'Gmail not connected' }, { status: 401 });
        }

        const { to, subject, body, threadId } = await req.json();

        if (!to || !subject || !body) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const accessToken = await getAccessToken(user.gmailRefreshToken);
        const rawEmail = createRawEmail(to, subject, body, threadId);

        const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(rawEmail)
        });

        const result = await sendResponse.json();

        return Response.json({ 
            success: true,
            messageId: result.id,
            threadId: result.threadId
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});