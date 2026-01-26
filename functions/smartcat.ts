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

// Fetch freelancer users from account using searchMyTeam endpoint
async function getFreelancers(filters = {}) {
    try {
        // Build query parameters for searchMyTeam
        const params = new URLSearchParams();
        if (filters.name) params.append('name', filters.name);
        if (filters.email) params.append('email', filters.email);
        if (filters.serviceType) params.append('serviceType', filters.serviceType);
        if (filters.sourceLanguage) params.append('sourceLanguage', filters.sourceLanguage);
        if (filters.targetLanguage) params.append('targetLanguage', filters.targetLanguage);
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.skip) params.append('skip', filters.skip.toString());
        
        const queryString = params.toString();
        const response = await smartcatFetch(`/account/searchMyTeam${queryString ? '?' + queryString : ''}`);
        
        // Transform the response to match expected frontend format
        const freelancers = (Array.isArray(response) ? response : response.items || []).map(user => ({
            id: user.id || user.userId,
            email: user.email,
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            firstName: user.firstName,
            lastName: user.lastName,
            languages: user.languages || [],
            serviceTypes: user.serviceTypes || [],
            specializations: user.specializations || [],
            rates: user.rates || [],
            externalId: user.externalId,
            created: user.created,
            status: user.status
        }));
        
        return {
            success: true,
            freelancers,
            total: response.total || freelancers.length
        };
    } catch (error) {
        // Check for specific permission errors
        if (error.message.includes('403') || error.message.includes('Forbidden')) {
            throw new Error('API permission denied: The searchMyTeam endpoint requires the "Manage team" permission in your Smartcat API key settings.');
        }
        if (error.message.includes('404') || error.message.includes('Not Found')) {
            throw new Error('API endpoint not available: The searchMyTeam endpoint may not be available on your Smartcat plan. Please contact Smartcat support to enable team management API access.');
        }
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

        let body;
        try {
            body = await req.json();
        } catch {
            return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const { action, ...params } = body;

        switch (action) {
            case 'getAccount': {
                const account = await getAccountDetails();
                return Response.json({ success: true, data: account });
            }

            case 'getFreelancers': {
                const result = await getFreelancers(params.filters || {});
                return Response.json({ success: true, data: result });
            }

            case 'getProjects': {
                const projects = await getProjects(params.filters || {});
                return Response.json({ success: true, data: projects });
            }

            case 'getProjectDetails': {
                if (!params.projectId) {
                    return Response.json({ error: 'projectId is required' }, { status: 400 });
                }
                const project = await getProjectDetails(params.projectId);
                return Response.json({ success: true, data: project });
            }

            default:
                return Response.json({ error: `Invalid action: ${action}` }, { status: 400 });
        }
    } catch (error) {
        console.error('Smartcat API error:', error);
        return Response.json({ 
            error: error.message,
            hint: 'Check if SMARTCAT_ACCOUNT_ID and SMARTCAT_API_KEY are correctly set'
        }, { status: 500 });
    }
});