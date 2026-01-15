import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SMARTCAT_API_KEY = Deno.env.get("SMARTCAT_API_KEY");
const SMARTCAT_ACCOUNT_ID = Deno.env.get("SMARTCAT_ACCOUNT_ID");
const SMARTCAT_BASE_URL = "https://smartcat.com/api/integration/v1";

// Create Basic Auth header
function getAuthHeader() {
    if (!SMARTCAT_ACCOUNT_ID || !SMARTCAT_API_KEY) {
        throw new Error('Smartcat credentials not configured. Please set SMARTCAT_ACCOUNT_ID and SMARTCAT_API_KEY secrets.');
    }
    const credentials = `${SMARTCAT_ACCOUNT_ID}:${SMARTCAT_API_KEY}`;
    // Use TextEncoder for proper base64 encoding
    const encoder = new TextEncoder();
    const data = encoder.encode(credentials);
    const encoded = btoa(String.fromCharCode(...data));
    return `Basic ${encoded}`;
}

async function smartcatFetch(endpoint, options = {}) {
    const url = `${SMARTCAT_BASE_URL}${endpoint}`;
    console.log(`Smartcat API call: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': getAuthHeader(),
            'Accept': 'application/json',
            ...options.headers,
        },
    });

    const responseText = await response.text();
    console.log(`Smartcat API response status: ${response.status}`);

    if (!response.ok) {
        console.error(`Smartcat API error: ${response.status} - ${responseText}`);
        throw new Error(`Smartcat API error: ${response.status} - ${responseText}`);
    }

    try {
        return JSON.parse(responseText);
    } catch {
        return responseText;
    }
}

// Fetch account details
async function getAccountDetails() {
    return smartcatFetch('/account');
}

// Fetch freelancer users from account
async function getFreelancers() {
    // The /account/searchMyTeam endpoint allows searching for team members
    // Alternative: use /directory/user to get users
    try {
        // Try fetching users with freelancer role
        const account = await getAccountDetails();
        return { 
            success: true, 
            accountName: account.name,
            accountId: account.id,
            message: 'Smartcat API connected. Note: Direct linguist listing requires specific API endpoints based on your Smartcat plan.'
        };
    } catch (error) {
        throw error;
    }
}

// Search for projects (to find assigned linguists)
async function getProjects(filters = {}) {
    const params = new URLSearchParams();
    if (filters.createdByUserId) params.append('createdByUserId', filters.createdByUserId);
    if (filters.projectName) params.append('projectName', filters.projectName);
    
    const queryString = params.toString();
    return smartcatFetch(`/project/list${queryString ? '?' + queryString : ''}`);
}

// Get project details (includes assigned linguists)
async function getProjectDetails(projectId) {
    return smartcatFetch(`/project/${projectId}`);
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