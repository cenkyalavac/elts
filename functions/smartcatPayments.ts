import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SMARTCAT_API_URL = 'https://smartcat.com/api/integration';

// Configuration check - validates required environment variables
function checkRequiredConfig() {
    const accountId = Deno.env.get('SMARTCAT_ACCOUNT_ID');
    const apiKey = Deno.env.get('SMARTCAT_API_KEY');
    
    if (!accountId) {
        throw new Error('Missing Configuration: SMARTCAT_ACCOUNT_ID');
    }
    if (!apiKey) {
        throw new Error('Missing Configuration: SMARTCAT_API_KEY');
    }
    
    return { accountId, apiKey };
}

// Smartcat API fetch helper
async function smartcatFetch(endpoint, options = {}) {
    const { accountId, apiKey } = checkRequiredConfig();
    const auth = 'Basic ' + btoa(`${accountId}:${apiKey}`);
    const url = `${SMARTCAT_API_URL}${endpoint}`;
    
    console.log(`[Smartcat] ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': auth,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    
    const text = await response.text();
    
    if (!response.ok) {
        console.error(`[Smartcat] Error ${response.status}: ${text}`);
        throw new Error(`Smartcat API error ${response.status}: ${text.substring(0, 300)}`);
    }
    
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

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

function getSmartcatAuth(accountId, apiKey) {
    return 'Basic ' + btoa(`${accountId}:${apiKey}`);
}

// Helper function to log admin actions
async function logAction(base44, { actorId, actorEmail, actionType, targetEntity, targetId, metadata }) {
    try {
        await base44.asServiceRole.entities.AdminAuditLog.create({
            actor_id: actorId,
            actor_email: actorEmail,
            action_type: actionType,
            target_entity: targetEntity,
            target_id: targetId,
            metadata: metadata
        });
    } catch (error) {
        console.error('Failed to log admin action:', error);
    }
}

Deno.serve(async (req) => {
    try {
        // Configuration check at the very start
        const { accountId, apiKey } = checkRequiredConfig();
        const auth = getSmartcatAuth(accountId, apiKey);
        
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || (user.role !== 'admin' && user.role !== 'project_manager')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, filters, tbms_data, payment_ids } = await req.json();

        // ==================== LIST PAYMENTS FROM SMARTCAT ====================
        if (action === 'list_payments') {
            const { date_from, date_to, skip = 0, limit = 100 } = filters || {};
            
            if (!date_from || !date_to) {
                return Response.json({ error: 'date_from and date_to are required' }, { status: 400 });
            }
            
            // Use v2 API to list payments by creation date
            const params = new URLSearchParams({
                dateCreatedFrom: new Date(date_from).toISOString(),
                dateCreatedTo: new Date(date_to + 'T23:59:59').toISOString(),
                skip: skip.toString(),
                limit: Math.min(limit, 500).toString()
            });
            
            const payments = await smartcatFetch(`/v2/invoice/job/listByCreatedDate?${params}`);
            
            // Get our freelancers for matching
            const freelancers = await base44.asServiceRole.entities.Freelancer.list();
            const freelancersByEmail = new Map(freelancers.map(f => [f.email?.toLowerCase(), f]));
            
            // Enrich with our freelancer data
            const enrichedPayments = (payments || []).map(p => ({
                ...p,
                matched_freelancer: freelancersByEmail.get(p.supplierEmail?.toLowerCase()) || null
            }));
            
            return Response.json({
                payments: enrichedPayments,
                total: enrichedPayments.length,
                date_range: { from: date_from, to: date_to }
            });
        }

        // ==================== LIST INVOICES FROM SMARTCAT ====================
        if (action === 'list_invoices') {
            const { date_from, date_to, skip = 0, limit = 10 } = filters || {};
            
            if (!date_from || !date_to) {
                return Response.json({ error: 'date_from and date_to are required' }, { status: 400 });
            }
            
            const params = new URLSearchParams({
                dateCreatedFrom: new Date(date_from).toISOString(),
                dateCreatedTo: new Date(date_to + 'T23:59:59').toISOString(),
                skip: skip.toString(),
                limit: Math.min(limit, 10).toString()
            });
            
            const invoices = await smartcatFetch(`/v2/invoice/list?${params}`);
            
            return Response.json({
                invoices: invoices || [],
                total: (invoices || []).length,
                date_range: { from: date_from, to: date_to }
            });
        }

        // ==================== CREATE PAYMENTS IN SMARTCAT ====================
        if (action === 'create_payments') {
            const { payments } = filters || {};
            
            if (!payments || !Array.isArray(payments) || payments.length === 0) {
                return Response.json({ error: 'payments array is required' }, { status: 400 });
            }
            
            // Validate each payment
            for (const p of payments) {
                if (!p.supplierEmail) {
                    return Response.json({ error: 'Each payment must have supplierEmail' }, { status: 400 });
                }
                if (!p.unitsAmount || p.unitsAmount <= 0) {
                    return Response.json({ error: 'Each payment must have valid unitsAmount' }, { status: 400 });
                }
                if (!p.pricePerUnit || p.pricePerUnit <= 0) {
                    return Response.json({ error: 'Each payment must have valid pricePerUnit' }, { status: 400 });
                }
            }
            
            // Format payments for Smartcat v2 API
            const smartcatPayments = payments.map(p => ({
                supplierEmail: p.supplierEmail,
                supplierName: p.supplierName || p.supplierEmail.split('@')[0],
                supplierType: p.supplierType || 'freelancer',
                serviceType: p.serviceType || 'Translation',
                jobDescription: p.jobDescription || p.description || 'Translation work',
                unitsType: p.unitsType || 'Words',
                unitsAmount: parseFloat(p.unitsAmount),
                pricePerUnit: parseFloat(p.pricePerUnit),
                currency: p.currency || 'USD',
                externalNumber: p.externalNumber || `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                payUntilDate: p.payUntilDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }));
            
            // Send to Smartcat
            const result = await smartcatFetch('/v2/invoice/jobs', {
                method: 'POST',
                body: JSON.stringify(smartcatPayments)
            });
            
            // Log the action
            await logAction(base44, {
                actorId: user.id,
                actorEmail: user.email,
                actionType: 'PAYMENT_BATCH',
                targetEntity: 'SmartcatPayment',
                targetId: `BATCH-${Date.now()}`,
                metadata: {
                    payment_count: smartcatPayments.length,
                    total_amount: smartcatPayments.reduce((sum, p) => sum + (p.unitsAmount * p.pricePerUnit), 0),
                    supplier_emails: smartcatPayments.map(p => p.supplierEmail),
                    smartcat_response: Array.isArray(result) ? result.map(r => ({ id: r.id, status: r.status })) : result
                }
            });
            
            return Response.json({
                success: true,
                created: Array.isArray(result) ? result.length : 1,
                payments: result,
                message: `Successfully created ${Array.isArray(result) ? result.length : 1} payment(s) in Smartcat`
            });
        }

        // ==================== GET PAYMENTS BY EXTERNAL IDS ====================
        if (action === 'get_payments_by_ids') {
            const { external_ids } = filters || {};
            
            if (!external_ids || !Array.isArray(external_ids) || external_ids.length === 0) {
                return Response.json({ error: 'external_ids array is required' }, { status: 400 });
            }
            
            const params = new URLSearchParams();
            external_ids.forEach(id => params.append('externalIds', id));
            
            const payments = await smartcatFetch(`/v2/invoice/job/listByExternalId?${params}`);
            
            return Response.json({
                payments: payments || [],
                total: (payments || []).length
            });
        }

        // ==================== LEGACY: GET PENDING PAYMENTS ====================
        if (action === 'get_pending_payments') {
            // Redirect to list_payments with default date range (last 30 days)
            const date_to = new Date().toISOString().split('T')[0];
            const date_from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            const payments = await smartcatFetch(`/v2/invoice/job/listByCreatedDate?dateCreatedFrom=${date_from}T00:00:00Z&dateCreatedTo=${date_to}T23:59:59Z&limit=100`);
            
            // Get our freelancers to match
            const freelancers = await base44.asServiceRole.entities.Freelancer.filter({ status: 'Approved' });
            const freelancerEmails = new Map(freelancers.map(f => [f.email?.toLowerCase(), f]));

            // Group by freelancer
            const paymentsByFreelancer = {};
            
            for (const job of (payments || [])) {
                const email = job.supplierEmail?.toLowerCase();
                if (!email) continue;

                const freelancer = freelancerEmails.get(email);

                if (!paymentsByFreelancer[email]) {
                    paymentsByFreelancer[email] = {
                        freelancer_id: freelancer?.id || null,
                        freelancer_name: freelancer?.full_name || job.supplierName,
                        email: email,
                        jobs: [],
                        total_amount: 0,
                        currency: job.currency || 'USD',
                        matched: !!freelancer
                    };
                }

                const amount = job.cost || (job.unitsAmount * job.pricePerUnit) || 0;
                paymentsByFreelancer[email].jobs.push({
                    job_id: job.id,
                    external_number: job.externalNumber,
                    description: job.jobDescription,
                    service_type: job.serviceType,
                    units: job.unitsAmount,
                    price_per_unit: job.pricePerUnit,
                    amount: amount,
                    status: job.status,
                    source_language: job.sourceLanguage,
                    target_language: job.targetLanguage
                });
                paymentsByFreelancer[email].total_amount += amount;
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
                if (f.email) freelancersByEmail.set(normalizeString(f.email), f);
                if (f.full_name) freelancersByName.set(normalizeString(f.full_name), f);
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

            const smartcatByEmail = new Map(smartcatTeam.map(m => [normalizeString(m.email), m]));
            const smartcatByName = new Map(smartcatTeam.map(m => {
                const name = m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim();
                return [normalizeString(name), m];
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
                const email = normalizeString(record.email || record.Email || record.translator_email || record['Translator Email'] || '');
                const name = normalizeString(record.name || record.Name || record.translator_name || record['Translator Name'] || record.resource || record.Resource || '');
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

            // Log the payment batch creation
            await logAction(base44, {
                actorId: user.id,
                actorEmail: user.email,
                actionType: 'PAYMENT_BATCH',
                targetEntity: 'PaymentBatch',
                targetId: batchId,
                metadata: { 
                    payment_count: paymentRecords.length,
                    total_amount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
                    freelancer_emails: payments.map(p => p.email)
                }
            });

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