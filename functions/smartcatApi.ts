import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Smartcat API v2 base URL
const SMARTCAT_API_BASE = 'https://smartcat.com/api/integration';

async function getSmartcatAuth() {
    const accountId = Deno.env.get('SMARTCAT_ACCOUNT_ID');
    const apiKey = Deno.env.get('SMARTCAT_API_KEY');
    
    if (!accountId || !apiKey) {
        throw new Error('Smartcat credentials not configured. Please set SMARTCAT_ACCOUNT_ID and SMARTCAT_API_KEY in settings.');
    }
    
    // Smartcat uses Basic Auth with accountId:apiKey
    return 'Basic ' + btoa(`${accountId}:${apiKey}`);
}

async function smartcatFetch(endpoint, options = {}) {
    const auth = await getSmartcatAuth();
    const url = endpoint.startsWith('http') ? endpoint : `${SMARTCAT_API_BASE}${endpoint}`;
    
    console.log(`[Smartcat API] ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': auth,
            'Accept': 'application/json',
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers
        }
    });
    
    const text = await response.text();
    
    if (!response.ok) {
        console.error(`[Smartcat API] Error ${response.status}: ${text}`);
        throw new Error(`Smartcat API error ${response.status}: ${text.substring(0, 200)}`);
    }
    
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

// Get account info to verify credentials
async function getAccountInfo() {
    return await smartcatFetch('/v1/account');
}

// Get project list using v2 API (supports pagination and more details)
async function getProjectList(limit = 100) {
    // v2 API returns more detailed project list
    const projects = await smartcatFetch(`/v2/project/list?limit=${limit}`);
    return Array.isArray(projects) ? projects : [];
}

// Get project details including documents and assignments
async function getProjectDetails(projectId) {
    return await smartcatFetch(`/v1/project/${projectId}`);
}

// Get project statistics (v2 API for more accurate data)
async function getProjectStatistics(projectId) {
    return await smartcatFetch(`/v2/project/${projectId}/statistics`);
}

// Get completed work statistics for a project
async function getCompletedWorkStatistics(projectId) {
    return await smartcatFetch(`/v1/project/${projectId}/completedWorkStatistics`);
}

// Extract team members from project documents
function extractAssigneesFromProject(projectDetails) {
    const assignees = new Map();
    
    if (!projectDetails?.documents) return assignees;
    
    for (const doc of projectDetails.documents) {
        const sourceLanguage = projectDetails.sourceLanguage;
        const targetLanguage = doc.targetLanguage;
        
        for (const stage of (doc.workflowStages || [])) {
            // Smartcat uses 'executives' array for assigned linguists
            const executives = stage.executives || [];
            
            for (const exec of executives) {
                // Smartcat executive object structure:
                // - userId: unique ID 
                // - supplierType: "Freelancer" or other
                // - assignedWordsCount: words assigned
                // - progress: completion percentage
                // For older projects, may use different field names
                
                const userId = exec.userId || exec.id || exec.assigneeId;
                const supplierType = exec.supplierType || 'Unknown';
                
                if (!userId) {
                    console.log('[Smartcat] Executive without userId:', JSON.stringify(exec));
                    continue;
                }
                
                if (!assignees.has(userId)) {
                    assignees.set(userId, {
                        userId: userId,
                        supplierType: supplierType,
                        assignedWordsCount: 0,
                        completedWordsCount: 0,
                        stages: new Set(),
                        languages: new Set(),
                        projectIds: new Set(),
                        rawSample: exec
                    });
                }
                
                const assignee = assignees.get(userId);
                assignee.assignedWordsCount += exec.assignedWordsCount || 0;
                assignee.completedWordsCount += exec.completedWordsCount || 0;
                assignee.stages.add(stage.stageType || stage.name || 'Translation');
                if (targetLanguage) assignee.languages.add(targetLanguage);
                assignee.projectIds.add(projectDetails.id);
            }
        }
    }
    
    return assignees;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || (user.role !== 'admin' && user.role !== 'project_manager')) {
            return Response.json({ error: 'Unauthorized - Admin or PM required' }, { status: 401 });
        }

        const body = await req.json();
        const { action, params } = body;

        // ==================== TEST CONNECTION ====================
        if (action === 'test_connection') {
            const account = await getAccountInfo();
            return Response.json({ 
                success: true, 
                account: {
                    id: account.id,
                    name: account.name,
                    isPersonal: account.isPersonal
                }
            });
        }

        // ==================== GET MY TEAM ====================
        if (action === 'get_my_team') {
            // First verify connection
            const account = await getAccountInfo();
            console.log(`[Smartcat] Connected to account: ${account.name}`);
            
            // Fetch recent projects
            const projects = await getProjectList(50);
            console.log(`[Smartcat] Found ${projects.length} projects`);
            
            if (projects.length === 0) {
                return Response.json({
                    team: [],
                    total: 0,
                    projectsScanned: 0,
                    accountName: account.name,
                    message: 'No projects found in your Smartcat account'
                });
            }
            
            const allAssignees = new Map();
            let projectsScanned = 0;
            let sampleProjectStructure = null;
            
            // Scan projects to extract assignees
            for (const project of projects.slice(0, 30)) {
                try {
                    const details = await getProjectDetails(project.id);
                    projectsScanned++;
                    
                    // Save sample for debugging
                    if (!sampleProjectStructure && details.documents?.length > 0) {
                        const firstDoc = details.documents[0];
                        const firstStage = firstDoc?.workflowStages?.[0];
                        sampleProjectStructure = {
                            projectName: details.name,
                            documentCount: details.documents.length,
                            sampleDocument: {
                                name: firstDoc?.name,
                                targetLanguage: firstDoc?.targetLanguage,
                                workflowStagesCount: firstDoc?.workflowStages?.length,
                            },
                            sampleStage: firstStage ? {
                                stageType: firstStage.stageType,
                                status: firstStage.status,
                                executivesCount: firstStage.executives?.length || 0,
                                sampleExecutive: firstStage.executives?.[0] || null
                            } : null
                        };
                        console.log('[Smartcat] Sample structure:', JSON.stringify(sampleProjectStructure, null, 2));
                    }
                    
                    const projectAssignees = extractAssigneesFromProject(details);
                    
                    for (const [userId, data] of projectAssignees) {
                        if (!allAssignees.has(userId)) {
                            allAssignees.set(userId, data);
                        } else {
                            const existing = allAssignees.get(userId);
                            existing.assignedWordsCount += data.assignedWordsCount;
                            existing.completedWordsCount += data.completedWordsCount;
                            data.stages.forEach(s => existing.stages.add(s));
                            data.languages.forEach(l => existing.languages.add(l));
                            data.projectIds.forEach(p => existing.projectIds.add(p));
                        }
                    }
                } catch (e) {
                    console.log(`[Smartcat] Skip project ${project.id}: ${e.message}`);
                }
            }
            
            console.log(`[Smartcat] Found ${allAssignees.size} unique assignees`);
            
            // Get freelancers for matching
            const freelancers = await base44.asServiceRole.entities.Freelancer.list();
            const freelancerBySmartcatId = new Map();
            
            for (const f of freelancers) {
                // Match by stored smartcat_id in tags or notes
                const smartcatIdTag = f.tags?.find(t => t.startsWith('smartcat:'));
                if (smartcatIdTag) {
                    freelancerBySmartcatId.set(smartcatIdTag.replace('smartcat:', ''), f);
                }
            }
            
            // Convert to array
            const team = Array.from(allAssignees.values()).map(m => {
                const matchedFreelancer = freelancerBySmartcatId.get(m.userId);
                return {
                    smartcat_id: m.userId,
                    supplierType: m.supplierType,
                    assignedWordsCount: m.assignedWordsCount,
                    completedWordsCount: m.completedWordsCount,
                    stages: Array.from(m.stages),
                    languages: Array.from(m.languages),
                    projectCount: m.projectIds.size,
                    matched: !!matchedFreelancer,
                    freelancer_id: matchedFreelancer?.id || null,
                    freelancer_name: matchedFreelancer?.full_name || null,
                    _debug: m.rawSample
                };
            });
            
            return Response.json({ 
                team,
                total: team.length,
                projectsScanned,
                accountName: account.name,
                sampleProjectStructure,
                note: 'Smartcat API does not provide linguist names/emails directly. You need to match by Smartcat User ID stored in your database.'
            });
        }

        // ==================== GET JOBS FOR PAYMENT ====================
        if (action === 'get_jobs_for_payment') {
            const { dateFrom, dateTo } = params || {};
            
            const projects = await getProjectList(100);
            let filteredProjects = projects;
            
            // Filter by date
            if (dateFrom || dateTo) {
                filteredProjects = projects.filter(p => {
                    const pDate = new Date(p.deadline || p.creationDate);
                    if (dateFrom && pDate < new Date(dateFrom)) return false;
                    if (dateTo && pDate > new Date(dateTo + 'T23:59:59')) return false;
                    return true;
                });
            }
            
            console.log(`[Smartcat] Processing ${filteredProjects.length} projects for payment`);
            
            // Get freelancers for matching
            const freelancers = await base44.asServiceRole.entities.Freelancer.list();
            const freelancerBySmartcatId = new Map();
            for (const f of freelancers) {
                const smartcatIdTag = f.tags?.find(t => t.startsWith('smartcat:'));
                if (smartcatIdTag) {
                    freelancerBySmartcatId.set(smartcatIdTag.replace('smartcat:', ''), f);
                }
            }
            
            const jobsByAssignee = new Map();
            let projectsProcessed = 0;
            
            for (const project of filteredProjects.slice(0, 50)) {
                try {
                    const details = await getProjectDetails(project.id);
                    projectsProcessed++;
                    
                    // Try to get completed work statistics
                    let completedStats = null;
                    try {
                        completedStats = await getCompletedWorkStatistics(project.id);
                    } catch (e) {
                        // Completed stats may not be available for all projects
                    }
                    
                    for (const doc of (details.documents || [])) {
                        for (const stage of (doc.workflowStages || [])) {
                            // Only include completed stages
                            if (stage.status !== 'completed' && stage.progress < 100) continue;
                            
                            for (const exec of (stage.executives || [])) {
                                const userId = exec.userId || exec.id;
                                if (!userId) continue;
                                
                                if (!jobsByAssignee.has(userId)) {
                                    const matchedFreelancer = freelancerBySmartcatId.get(userId);
                                    
                                    jobsByAssignee.set(userId, {
                                        smartcat_id: userId,
                                        supplierType: exec.supplierType || 'Unknown',
                                        freelancer_id: matchedFreelancer?.id || null,
                                        freelancer_name: matchedFreelancer?.full_name || null,
                                        freelancer_email: matchedFreelancer?.email || null,
                                        matched: !!matchedFreelancer,
                                        jobs: [],
                                        totalWords: 0
                                    });
                                }
                                
                                const assigneeData = jobsByAssignee.get(userId);
                                const wordsCount = exec.completedWordsCount || exec.assignedWordsCount || 0;
                                
                                assigneeData.jobs.push({
                                    projectId: project.id,
                                    projectName: project.name || details.name,
                                    documentName: doc.name,
                                    stageType: stage.stageType || stage.name,
                                    sourceLanguage: details.sourceLanguage,
                                    targetLanguage: doc.targetLanguage,
                                    wordsCount: wordsCount,
                                    deadline: project.deadline,
                                    status: stage.status
                                });
                                assigneeData.totalWords += wordsCount;
                            }
                        }
                    }
                } catch (e) {
                    console.log(`[Smartcat] Skip project ${project.id}: ${e.message}`);
                }
            }
            
            const result = Array.from(jobsByAssignee.values());
            
            return Response.json({
                assignees: result,
                total: result.length,
                totalWords: result.reduce((sum, a) => sum + a.totalWords, 0),
                projectsProcessed,
                note: 'Jobs are extracted from completed workflow stages. Link freelancers by Smartcat User ID.'
            });
        }

        // ==================== SYNC TEAM TO BASE44 ====================
        if (action === 'sync_to_base44') {
            const { members } = params || {};
            
            if (!members?.length) {
                return Response.json({ error: 'No members to sync' }, { status: 400 });
            }
            
            const existingFreelancers = await base44.asServiceRole.entities.Freelancer.list();
            const existingBySmartcatId = new Map();
            
            for (const f of existingFreelancers) {
                const smartcatIdTag = f.tags?.find(t => t.startsWith('smartcat:'));
                if (smartcatIdTag) {
                    existingBySmartcatId.set(smartcatIdTag.replace('smartcat:', ''), f);
                }
            }
            
            let created = 0;
            let updated = 0;
            const results = [];
            
            for (const member of members) {
                const existing = existingBySmartcatId.get(member.smartcat_id);
                
                if (!existing) {
                    // Create new freelancer placeholder
                    const newFreelancer = await base44.asServiceRole.entities.Freelancer.create({
                        full_name: `Smartcat User ${member.smartcat_id.substring(0, 8)}`,
                        status: 'Approved',
                        tags: ['Smartcat Team', `smartcat:${member.smartcat_id}`],
                        notes: `Auto-imported from Smartcat on ${new Date().toISOString().split('T')[0]}. Languages: ${member.languages?.join(', ') || 'N/A'}. Please update name and contact info.`
                    });
                    created++;
                    results.push({ action: 'created', smartcat_id: member.smartcat_id, id: newFreelancer.id });
                } else if (!existing.tags?.includes('Smartcat Team')) {
                    // Update existing to add Smartcat Team tag
                    await base44.asServiceRole.entities.Freelancer.update(existing.id, {
                        tags: [...(existing.tags || []), 'Smartcat Team']
                    });
                    updated++;
                    results.push({ action: 'updated', smartcat_id: member.smartcat_id, id: existing.id });
                }
            }
            
            return Response.json({ 
                created, 
                updated, 
                total: members.length,
                results,
                note: 'Freelancers are created with placeholder names. Please update their details manually.'
            });
        }

        // ==================== LINK FREELANCER TO SMARTCAT ====================
        if (action === 'link_freelancer') {
            const { freelancer_id, smartcat_id } = params || {};
            
            if (!freelancer_id || !smartcat_id) {
                return Response.json({ error: 'freelancer_id and smartcat_id are required' }, { status: 400 });
            }
            
            const freelancers = await base44.asServiceRole.entities.Freelancer.filter({ id: freelancer_id });
            if (!freelancers?.length) {
                return Response.json({ error: 'Freelancer not found' }, { status: 404 });
            }
            
            const freelancer = freelancers[0];
            let tags = freelancer.tags || [];
            
            // Remove any existing smartcat tag
            tags = tags.filter(t => !t.startsWith('smartcat:'));
            tags.push(`smartcat:${smartcat_id}`);
            
            if (!tags.includes('Smartcat Team')) {
                tags.push('Smartcat Team');
            }
            
            await base44.asServiceRole.entities.Freelancer.update(freelancer_id, { tags });
            
            return Response.json({ 
                success: true, 
                message: `Linked ${freelancer.full_name} to Smartcat ID ${smartcat_id}` 
            });
        }

        // ==================== INVITE USER (via email) ====================
        if (action === 'invite_user') {
            const { email, name, message } = params || {};
            
            if (!email || !name) {
                return Response.json({ error: 'email and name are required' }, { status: 400 });
            }
            
            // Check if freelancer already exists
            const existing = await base44.asServiceRole.entities.Freelancer.filter({ email: email.toLowerCase() });
            
            let freelancerId;
            if (existing?.length) {
                freelancerId = existing[0].id;
            } else {
                // Create new freelancer
                const newFreelancer = await base44.asServiceRole.entities.Freelancer.create({
                    full_name: name,
                    email: email.toLowerCase(),
                    status: 'New Application',
                    tags: ['Invited'],
                    notes: `Invited on ${new Date().toISOString().split('T')[0]}${message ? `. Message: ${message}` : ''}`
                });
                freelancerId = newFreelancer.id;
            }
            
            // Send invitation email
            await base44.integrations.Core.SendEmail({
                to: email,
                subject: `Invitation to Join Our Translation Team`,
                body: `
                    <h2>Hello ${name}!</h2>
                    <p>We'd like to invite you to join our team of professional translators.</p>
                    ${message ? `<p><em>"${message}"</em></p>` : ''}
                    <p>Please reach out if you're interested in collaborating with us.</p>
                    <br/>
                    <p>Best regards,<br/>The el turco Team</p>
                `
            });
            
            return Response.json({ 
                success: true, 
                freelancer_id: freelancerId,
                message: `Invitation sent to ${email}` 
            });
        }

        return Response.json({ error: `Invalid action: ${action}` }, { status: 400 });
        
    } catch (error) {
        console.error('[Smartcat API] Error:', error);
        return Response.json({ 
            error: error.message,
            hint: 'Check your SMARTCAT_ACCOUNT_ID and SMARTCAT_API_KEY in settings'
        }, { status: 500 });
    }
});