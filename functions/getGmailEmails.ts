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

async function getEmailDetails(messageId, accessToken) {
    const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        { headers: { 'Authorization': `Bearer ${accessToken}` }}
    );
    return await response.json();
}

function extractBodyFromPayload(payload) {
    let body = '';
    
    if (payload.body?.data) {
        body = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    } else if (payload.parts) {
        const findBody = (parts) => {
            for (const part of parts) {
                if ((part.mimeType === 'text/plain' || part.mimeType === 'text/html') && part.body?.data) {
                    return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                }
                if (part.parts) {
                    const nestedBody = findBody(part.parts);
                    if (nestedBody) return nestedBody;
                }
            }
            return '';
        };
        body = findBody(payload.parts);
    }
    
    return body;
}

function extractAttachments(payload) {
    const attachments = [];
    
    const findAttachments = (parts) => {
        if (!parts) return;
        for (const part of parts) {
            if (part.filename && part.body?.attachmentId) {
                attachments.push({
                    filename: part.filename,
                    attachmentId: part.body.attachmentId,
                    mimeType: part.mimeType,
                    size: part.body.size || 0
                });
            }
            if (part.parts) {
                findAttachments(part.parts);
            }
        }
    };
    
    findAttachments(payload.parts);
    return attachments;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || !user.gmailRefreshToken) {
            return Response.json({ error: 'Gmail not connected' }, { status: 401 });
        }

        const { email, maxResults = 20 } = await req.json();

        const accessToken = await getAccessToken(user.gmailRefreshToken);

        // Search for emails from/to this address, or all recent emails
        const query = email ? `from:${email} OR to:${email}` : '';
        const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?` +
            `q=${encodeURIComponent(query)}&maxResults=${maxResults}`;

        const searchResponse = await fetch(searchUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        const searchData = await searchResponse.json();

        if (!searchData.messages) {
            return Response.json({ emails: [] });
        }

        // Get details for each email
        const emails = await Promise.all(
            searchData.messages.map(msg => getEmailDetails(msg.id, accessToken))
        );

        // Parse emails
        const parsedEmails = emails.map(email => {
            const headers = email.payload.headers;
            const getHeader = (name) => headers.find(h => h.name === name)?.value || '';

            const body = extractBodyFromPayload(email.payload);
            const attachments = extractAttachments(email.payload);

            return {
                id: email.id,
                threadId: email.threadId,
                subject: getHeader('Subject'),
                from: getHeader('From'),
                to: getHeader('To'),
                date: getHeader('Date'),
                snippet: email.snippet,
                body: body.substring(0, 5000), // Limit body length
                labels: email.labelIds || [],
                attachments: attachments
            };
        });

        return Response.json({ emails: parsedEmails });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});