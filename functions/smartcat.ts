import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SMARTCAT_API_KEY = Deno.env.get("SMARTCAT_API_KEY");
const SMARTCAT_ACCOUNT_ID = Deno.env.get("SMARTCAT_ACCOUNT_ID");
const SMARTCAT_BASE_URL = "https://smartcat.com/api/integration/v1";

// Create Basic Auth header
function getAuthHeader() {
    const credentials = `${SMARTCAT_ACCOUNT_ID}:${SMARTCAT_API_KEY}`;
    const encoded = btoa(credentials);
    return `Basic ${encoded}`;
}

async function smartcatFetch(endpoint, options = {}) {
    const url = `${SMARTCAT_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Smartcat API error: ${response.status} - ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }
    return response.text();
}

// Fetch account details
async function getAccountDetails() {
    return smartcatFetch('/account');
}

// Fetch MyTeam linguists (translators)
async function getMyTeamLinguists() {
    return smartcatFetch('/myteam');
}

// Search for a specific linguist by email
async function searchLinguist(email) {
    const linguists = await getMyTeamLinguists();
    return linguists.find(l => l.email?.toLowerCase() === email?.toLowerCase());
}

// Get linguist by ID
async function getLinguistById(linguistId) {
    return smartcatFetch(`/myteam/${linguistId}`);
}

// Create a payable (payment job)
async function createPayable(payableData) {
    // Payable structure:
    // {
    //   "userId": "string", // Smartcat user ID
    //   "serviceType": "Translation", // or other service types
    //   "jobDescription": "string",
    //   "unitsType": "Words", // Words, Hours, Pages, etc.
    //   "unitsAmount": number,
    //   "pricePerUnit": number,
    //   "currency": "USD",
    //   "releaseDate": "2024-01-15" // optional
    // }
    return smartcatFetch('/payable', {
        method: 'POST',
        body: JSON.stringify(payableData),
    });
}

// Get list of payables
async function getPayables(filters = {}) {
    const params = new URLSearchParams();
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.status) params.append('status', filters.status);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    
    const queryString = params.toString();
    return smartcatFetch(`/payable${queryString ? '?' + queryString : ''}`);
}

// Create bulk payables from parsed data
async function createBulkPayables(payables) {
    const results = [];
    for (const payable of payables) {
        try {
            const result = await createPayable(payable);
            results.push({ success: true, data: result, original: payable });
        } catch (error) {
            results.push({ success: false, error: error.message, original: payable });
        }
    }
    return results;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, ...params } = await req.json();

        switch (action) {
            case 'getAccount': {
                const account = await getAccountDetails();
                return Response.json({ success: true, data: account });
            }

            case 'getLinguists': {
                const linguists = await getMyTeamLinguists();
                return Response.json({ success: true, data: linguists });
            }

            case 'searchLinguist': {
                const linguist = await searchLinguist(params.email);
                return Response.json({ success: true, data: linguist });
            }

            case 'getLinguist': {
                const linguist = await getLinguistById(params.linguistId);
                return Response.json({ success: true, data: linguist });
            }

            case 'createPayable': {
                // Only admin can create payables
                if (user.role !== 'admin') {
                    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
                }
                const result = await createPayable(params.payableData);
                return Response.json({ success: true, data: result });
            }

            case 'createBulkPayables': {
                // Only admin can create bulk payables
                if (user.role !== 'admin') {
                    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
                }
                const results = await createBulkPayables(params.payables);
                return Response.json({ success: true, data: results });
            }

            case 'getPayables': {
                const payables = await getPayables(params.filters || {});
                return Response.json({ success: true, data: payables });
            }

            default:
                return Response.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Smartcat API error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});