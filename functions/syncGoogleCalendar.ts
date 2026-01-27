import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Configuration check - validates Google Calendar connector is available
async function checkGoogleCalendarConfig(base44) {
    try {
        const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");
        if (!accessToken) {
            throw new Error('Missing Configuration: Google Calendar connector not authorized');
        }
        return accessToken;
    } catch (error) {
        if (error.message.includes('Missing Configuration')) {
            throw error;
        }
        throw new Error('Missing Configuration: Google Calendar connector not authorized. Please connect your Google Calendar in settings.');
    }
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Configuration check at the very start
        const accessToken = await checkGoogleCalendarConfig(base44);

        const { freelancerId, calendarId, action, daysAhead = 30 } = await req.json();

        // Action: List available calendars
        if (action === 'listCalendars') {
            const calendarListResponse = await fetch(
                'https://www.googleapis.com/calendar/v3/users/me/calendarList',
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            );

            if (!calendarListResponse.ok) {
                const error = await calendarListResponse.text();
                return Response.json({ error: 'Failed to fetch calendars: ' + error }, { status: 500 });
            }

            const calendarListData = await calendarListResponse.json();
            const calendars = (calendarListData.items || []).map(cal => ({
                id: cal.id,
                summary: cal.summary,
                description: cal.description,
                backgroundColor: cal.backgroundColor,
                primary: cal.primary || false,
            }));

            return Response.json({ calendars });
        }

        // For sync action, freelancerId is required
        if (!freelancerId) {
            return Response.json({ error: 'freelancerId is required' }, { status: 400 });
        }

        // Use selected calendar or primary
        const targetCalendarId = calendarId || 'primary';

        // Calculate date range
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + daysAhead);

        // Fetch calendar events
        const calendarUrl = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events`);
        calendarUrl.searchParams.set('timeMin', now.toISOString());
        calendarUrl.searchParams.set('timeMax', endDate.toISOString());
        calendarUrl.searchParams.set('singleEvents', 'true');
        calendarUrl.searchParams.set('orderBy', 'startTime');
        calendarUrl.searchParams.set('maxResults', '250');

        const calendarResponse = await fetch(calendarUrl.toString(), {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            }
        });

        if (!calendarResponse.ok) {
            const error = await calendarResponse.text();
            console.error('Google Calendar API error:', error);
            return Response.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
        }

        const calendarData = await calendarResponse.json();
        const events = calendarData.items || [];

        // Process events - only consider "busy" events
        const busyEvents = events.filter(event => {
            // Skip all-day events or events without proper time
            if (!event.start?.dateTime) return false;
            // Only include events that show as busy
            return event.transparency !== 'transparent';
        });

        // Calculate date range boundaries for filtering existing records
        const startDateStr = now.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        // Get existing availability records for this freelancer within the sync range
        const allAvailability = await base44.asServiceRole.entities.Availability.filter({
            freelancer_id: freelancerId
        });
        
        // Filter to only records within our sync date range
        const existingAvailability = allAvailability.filter(a => 
            a.date >= startDateStr && a.date <= endDateStr
        );

        // Create a map of dates with busy events
        const busyDates = new Map();
        
        for (const event of busyEvents) {
            const startDate = new Date(event.start.dateTime);
            const endDateEvent = new Date(event.end.dateTime);
            const dateKey = startDate.toISOString().split('T')[0];

            if (!busyDates.has(dateKey)) {
                busyDates.set(dateKey, {
                    totalBusyHours: 0,
                    events: []
                });
            }

            const durationHours = (endDateEvent - startDate) / (1000 * 60 * 60);
            const dateData = busyDates.get(dateKey);
            dateData.totalBusyHours += durationHours;
            dateData.events.push({
                start_time: startDate.toTimeString().slice(0, 5),
                end_time: endDateEvent.toTimeString().slice(0, 5),
                summary: event.summary || 'Busy'
            });
        }

        // Prepare all database operations
        const operations = [];
        let created = 0;
        let updated = 0;
        let cleared = 0;

        // Process busy dates - create or update records
        for (const [date, data] of busyDates) {
            const existingRecord = existingAvailability.find(a => a.date === date);
            
            // Determine availability status based on busy hours (8-hour workday)
            let status = 'available';
            let hoursAvailable = 8 - data.totalBusyHours;
            
            if (data.totalBusyHours >= 8) {
                status = 'unavailable';
                hoursAvailable = 0;
            } else if (data.totalBusyHours >= 4) {
                status = 'partially_available';
            }

            const availabilityData = {
                freelancer_id: freelancerId,
                date: date,
                status: status,
                hours_available: Math.max(0, Math.round(hoursAvailable * 10) / 10),
                notes: `Synced from Google Calendar (${data.events.length} events)`,
            };

            if (existingRecord) {
                operations.push(
                    base44.asServiceRole.entities.Availability.update(existingRecord.id, availabilityData)
                        .then(() => 'updated')
                );
            } else {
                operations.push(
                    base44.asServiceRole.entities.Availability.create(availabilityData)
                        .then(() => 'created')
                );
            }
        }

        // Find records that were synced from calendar but no longer have events (ghost events)
        const syncedRecordsToReset = existingAvailability.filter(a => 
            a.notes?.includes('Synced from Google Calendar') && 
            !busyDates.has(a.date)
        );

        // Reset these records to available
        for (const record of syncedRecordsToReset) {
            operations.push(
                base44.asServiceRole.entities.Availability.update(record.id, {
                    status: 'available',
                    hours_available: 8,
                    notes: 'Calendar event removed - reset to available'
                }).then(() => 'cleared')
            );
        }

        // Execute all operations in parallel
        const results = await Promise.all(operations);
        
        // Count results
        for (const result of results) {
            if (result === 'created') created++;
            else if (result === 'updated') updated++;
            else if (result === 'cleared') cleared++;
        }

        console.log('Calendar Sync Summary:', { freelancerId, calendarId: targetCalendarId, created, updated, cleared, dateRange: { start: startDateStr, end: endDateStr } });

        return Response.json({
            success: true,
            eventsProcessed: busyEvents.length,
            datesAffected: busyDates.size,
            calendarId: targetCalendarId,
            created,
            updated,
            cleared
        });

    } catch (error) {
        console.error('Sync error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});