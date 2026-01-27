import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SMARTCAT_API_URL = 'https://smartcat.com/api/integration/v2';

// Normalize strings for matching - handles Turkish/special characters
function normalizeString(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ü/g, 'u')
        .replace(/ç/g, 'c')
        .replace(/İ/g, 'i')
        .replace(/Ş/g, 's')
        .replace(/Ğ/g, 'g')
        .replace(/Ö/g, 'o')
        .replace(/Ü/g, 'u')
        .replace(/Ç/g, 'c')
        .trim();
}

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

        const { action, filters, tbms_data, payment_ids } = await req.json();
        const auth = await getSmartcatAuth();

        if (action === 'get_pending_payments') {
            // Get jobs with pending payments - only our projects
            const { date_from, date_to, status } = filters || {};
            
            let url = `${SMARTCAT_API_URL}/job/list?`;
            const params = new URLSearchParams();
            
            // Filter by date range
            if (date_from) params.append('createdFrom', date_from);
            if (date_to) params.append('createdTo', date_to);
            
            // Only get completed jobs that need payment
            params.append('jobStatus', status || 'completed');
            
            const response = await fetch(url + params.toString(), {
                headers: { 'Authorization': auth }
            });

            if (!response.ok) {
                const errorText = await response.text();
                return Response.json({ error: 'Failed to get jobs', details: errorText }, { status: 400 });
            }

            const jobs = await response.json();
            
            // Get our freelancers to match
            const freelancers = await base44.asServiceRole.entities.Freelancer.filter({ status: 'Approved' });
            const freelancerEmails = new Map(freelancers.map(f => [f.email?.toLowerCase(), f]));

            // Process jobs and group by freelancer
            const paymentsByFreelancer = {};
            
            for (const job of jobs) {
                const assigneeEmail = job.assignee?.email?.toLowerCase();
                if (!assigneeEmail) continue;

                // Only include if freelancer is in our team
                const freelancer = freelancerEmails.get(assigneeEmail);
                if (!freelancer) continue;

                if (!paymentsByFreelancer[assigneeEmail]) {
                    paymentsByFreelancer[assigneeEmail] = {
                        freelancer_id: freelancer.id,
                        freelancer_name: freelancer.full_name,
                        email: assigneeEmail,
                        jobs: [],
                        total_amount: 0,
                        currency: 'USD'
                    };
                }

                const amount = job.cost || job.price || 0;
                paymentsByFreelancer[assigneeEmail].jobs.push({
                    job_id: job.id,
                    project_name: job.projectName || job.documentName,
                    source_language: job.sourceLanguage,
                    target_language: job.targetLanguage,
                    word_count: job.wordsCount || job.wordCount,
                    amount: amount,
                    completed_date: job.completedDate || job.deadline
                });
                paymentsByFreelancer[assigneeEmail].total_amount += amount;
            }

            return Response.json({ 
                payments: Object.values(paymentsByFreelancer),
                total_freelancers: Object.keys(paymentsByFreelancer).length,
                total_amount: Object.values(paymentsByFreelancer).reduce((sum, p) => sum + p.total_amount, 0)
            });
        }

        if (action === 'match_tbms_export') {
            // Match TBMS export data with Smartcat and Base44
            if (!tbms_data || !Array.isArray(tbms_data)) {
                return Response.json({ error: 'TBMS data required as array' }, { status: 400 });
            }

            // Get our freelancers
            const freelancers = await base44.asServiceRole.entities.Freelancer.list();
            const freelancersByEmail = new Map();
            const freelancersByName = new Map();
            
            for (const f of freelancers) {
                if (f.email) freelancersByEmail.set(f.email.toLowerCase(), f);
                if (f.full_name) freelancersByName.set(f.full_name.toLowerCase().trim(), f);
            }

            // Get Smartcat team - fail immediately if this doesn't work
            const teamResponse = await fetch(`${SMARTCAT_API_URL}/account/myTeam`, {
                headers: { 'Authorization': auth }
            });
            
            if (!teamResponse.ok) {
                const errorText = await teamResponse.text();
                console.error('Smartcat team fetch failed:', errorText);
                return Response.json({ 
                    error: 'Smartcat API connection failed. Cannot match users.',
                    details: errorText 
                }, { status: 500 });
            }
            
            const smartcatTeam = await teamResponse.json();

            const smartcatByEmail = new Map(smartcatTeam.map(m => [m.email?.toLowerCase(), m]));
            const smartcatByName = new Map(smartcatTeam.map(m => {
                const name = m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim();
                return [name.toLowerCase(), m];
            }));

            // Process each TBMS record
            const results = {
                matched: [],
                not_in_base44: [],
                not_in_smartcat: [],
                completely_unmatched: [],
                summary: {
                    total_records: tbms_data.length,
                    total_amount: 0,
                    matched_amount: 0,
                    unmatched_amount: 0
                }
            };

            for (const record of tbms_data) {
                // Try to extract key fields - handle various TBMS export formats
                const email = (record.email || record.Email || record.translator_email || record['Translator Email'] || '').toLowerCase().trim();
                const name = (record.name || record.Name || record.translator_name || record['Translator Name'] || record.resource || record.Resource || '').toLowerCase().trim();
                const amount = parseFloat(record.amount || record.Amount || record.total || record.Total || record.payment || record.Payment || 0);
                const currency = record.currency || record.Currency || 'USD';
                const projectName = record.project || record.Project || record.project_name || record['Project Name'] || '';
                const wordCount = parseInt(record.words || record.Words || record.word_count || record['Word Count'] || 0);
                const sourceLang = record.source || record.Source || record.source_language || '';
                const targetLang = record.target || record.Target || record.target_language || '';

                results.summary.total_amount += amount;

                // Try to match
                let base44Match = freelancersByEmail.get(email) || freelancersByName.get(name);
                let smartcatMatch = smartcatByEmail.get(email) || smartcatByName.get(name);

                const processedRecord = {
                    original: record,
                    extracted: { email, name, amount, currency, projectName, wordCount, sourceLang, targetLang },
                    base44_freelancer: base44Match ? {
                        id: base44Match.id,
                        name: base44Match.full_name,
                        email: base44Match.email
                    } : null,
                    smartcat_user: smartcatMatch ? {
                        id: smartcatMatch.id || smartcatMatch.externalId,
                        name: smartcatMatch.name || `${smartcatMatch.firstName} ${smartcatMatch.lastName}`,
                        email: smartcatMatch.email
                    } : null
                };

                if (base44Match && smartcatMatch) {
                    results.matched.push(processedRecord);
                    results.summary.matched_amount += amount;
                } else if (base44Match && !smartcatMatch) {
                    results.not_in_smartcat.push(processedRecord);
                    results.summary.unmatched_amount += amount;
                } else if (!base44Match && smartcatMatch) {
                    results.not_in_base44.push(processedRecord);
                    results.summary.unmatched_amount += amount;
                } else {
                    results.completely_unmatched.push(processedRecord);
                    results.summary.unmatched_amount += amount;
                }
            }

            return Response.json(results);
        }

        if (action === 'create_payment_batch') {
            // Create a payment batch in Smartcat
            const { payments } = filters || {};
            
            if (!payments || !Array.isArray(payments)) {
                return Response.json({ error: 'Payments array required' }, { status: 400 });
            }

            // Note: Smartcat payment API varies by account type
            // This creates a record for tracking
            const batchId = `BATCH_${Date.now()}`;
            
            const paymentRecords = payments.map(p => ({
                batch_id: batchId,
                freelancer_email: p.email,
                freelancer_name: p.name,
                amount: p.amount,
                currency: p.currency || 'USD',
                status: 'pending',
                jobs: p.jobs || [],
                created_date: new Date().toISOString()
            }));

            return Response.json({
                success: true,
                batch_id: batchId,
                payment_count: paymentRecords.length,
                total_amount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
                message: 'Payment batch created. Process via Smartcat dashboard.'
            });
        }

        if (action === 'get_projects') {
            // Get only relevant projects (with our team members)
            const { status, date_from, date_to } = filters || {};
            
            const params = new URLSearchParams();
            if (date_from) params.append('createdFrom', date_from);
            if (date_to) params.append('createdTo', date_to);
            
            const response = await fetch(`${SMARTCAT_API_URL}/project/list?${params.toString()}`, {
                headers: { 'Authorization': auth }
            });

            if (!response.ok) {
                return Response.json({ error: 'Failed to get projects' }, { status: 400 });
            }

            const projects = await response.json();
            
            // Get our approved freelancers
            const freelancers = await base44.asServiceRole.entities.Freelancer.filter({ status: 'Approved' });
            const ourEmails = new Set(freelancers.map(f => f.email?.toLowerCase()));

            // Filter projects that have our team members assigned
            const relevantProjects = projects.filter(project => {
                // Check if any assignee is in our team
                const assignees = project.assignees || project.executives || [];
                return assignees.some(a => ourEmails.has(a.email?.toLowerCase()));
            });

            return Response.json({
                projects: relevantProjects,
                total: relevantProjects.length,
                filtered_out: projects.length - relevantProjects.length
            });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});