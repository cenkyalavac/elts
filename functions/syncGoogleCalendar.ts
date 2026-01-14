import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || (user.role !== 'admin' && user.role !== 'project_manager')) {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { freelancer_id, action } = await req.json();

        if (action === 'fetch') {
            // Get user's Google Calendar access token from their own OAuth
            // This requires the user to have connected their own Google Calendar
            const accessToken = await base44.connectors.getAccessToken("googlecalendar");

            const freelancer = await base44.asServiceRole.entities.Freelancer.filter({ id: freelancer_id });
            if (!freelancer || freelancer.length === 0) {
                return Response.json({ error: 'Freelancer not found' }, { status: 404 });
            }

            const freelancerData = freelancer[0];
            const calendarEmail = freelancerData.email;

            // Fetch calendar events for the next 30 days
            const now = new Date();
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);

            const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarEmail)}/events?timeMin=${now.toISOString()}&timeMax=${futureDate.toISOString()}&singleEvents=true&orderBy=startTime`;

            const response = await fetch(calendarUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Google Calendar API error:', errorText);
                return Response.json({ 
                    error: 'Failed to fetch calendar',
                    details: errorText,
                    status: response.status
                }, { status: response.status });
            }

            const calendarData = await response.json();
            
            // Parse events and create/update availability records
            const unavailabilityRecords = [];
            
            for (const event of calendarData.items || []) {
                if (!event.start || !event.end) continue;

                const startDate = event.start.date || event.start.dateTime;
                const endDate = event.end.date || event.end.dateTime;
                
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                // Create unavailability records for each day
                const currentDate = new Date(start);
                while (currentDate <= end) {
                    const dateStr = currentDate.toISOString().split('T')[0];
                    
                    unavailabilityRecords.push({
                        freelancer_id: freelancer_id,
                        date: dateStr,
                        status: 'unavailable',
                        notes: `Busy: ${event.summary || 'No title'}`,
                        hours_available: 0
                    });
                    
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }

            // Update availability records
            for (const record of unavailabilityRecords) {
                const existing = await base44.asServiceRole.entities.Availability.filter({
                    freelancer_id: record.freelancer_id,
                    date: record.date
                });

                if (existing && existing.length > 0) {
                    await base44.asServiceRole.entities.Availability.update(existing[0].id, record);
                } else {
                    await base44.asServiceRole.entities.Availability.create(record);
                }
            }

            return Response.json({
                success: true,
                events: calendarData.items?.length || 0,
                unavailabilityRecords: unavailabilityRecords.length
            });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Error syncing calendar:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});