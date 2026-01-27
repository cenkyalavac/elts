import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Query conversations where user is a participant and has unread messages
        const conversations = await base44.entities.Conversation.filter({
            participant_emails: user.email
        });

        // Count conversations where user has unread messages
        const unreadCount = conversations.filter(c => 
            c.unread_by?.includes(user.email)
        ).length;

        return Response.json({ count: unreadCount });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});