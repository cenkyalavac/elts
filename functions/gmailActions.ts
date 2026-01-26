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
    if (!data.access_token) {
        throw new Error('Failed to get access token');
    }
    return data.access_token;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.gmailRefreshToken) {
            return Response.json({ error: 'Gmail not connected' }, { status: 401 });
        }

        const { action, messageId, messageIds } = await req.json();
        const accessToken = await getAccessToken(user.gmailRefreshToken);

        let result;

        switch (action) {
            case 'archive': {
                // Remove from INBOX label
                const ids = messageIds || [messageId];
                await Promise.all(ids.map(id =>
                    fetch(
                        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`,
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                removeLabelIds: ['INBOX']
                            })
                        }
                    )
                ));
                result = { success: true, archived: ids.length };
                break;
            }

            case 'trash': {
                // Move to trash
                const ids = messageIds || [messageId];
                await Promise.all(ids.map(id =>
                    fetch(
                        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/trash`,
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`
                            }
                        }
                    )
                ));
                result = { success: true, trashed: ids.length };
                break;
            }

            case 'markRead': {
                const ids = messageIds || [messageId];
                await Promise.all(ids.map(id =>
                    fetch(
                        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`,
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                removeLabelIds: ['UNREAD']
                            })
                        }
                    )
                ));
                result = { success: true, markedRead: ids.length };
                break;
            }

            case 'markUnread': {
                const ids = messageIds || [messageId];
                await Promise.all(ids.map(id =>
                    fetch(
                        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`,
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                addLabelIds: ['UNREAD']
                            })
                        }
                    )
                ));
                result = { success: true, markedUnread: ids.length };
                break;
            }

            case 'star': {
                const ids = messageIds || [messageId];
                await Promise.all(ids.map(id =>
                    fetch(
                        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`,
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                addLabelIds: ['STARRED']
                            })
                        }
                    )
                ));
                result = { success: true, starred: ids.length };
                break;
            }

            case 'unstar': {
                const ids = messageIds || [messageId];
                await Promise.all(ids.map(id =>
                    fetch(
                        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`,
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                removeLabelIds: ['STARRED']
                            })
                        }
                    )
                ));
                result = { success: true, unstarred: ids.length };
                break;
            }

            case 'getAttachment': {
                const { attachmentId } = await req.json();
                const response = await fetch(
                    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    }
                );
                const attachmentData = await response.json();
                result = { 
                    success: true, 
                    data: attachmentData.data,
                    size: attachmentData.size
                };
                break;
            }

            default:
                return Response.json({ error: 'Invalid action' }, { status: 400 });
        }

        return Response.json(result);

    } catch (error) {
        console.error('Gmail action error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});