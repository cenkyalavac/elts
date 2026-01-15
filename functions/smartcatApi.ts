import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Smartcat API - using v1 which is more reliable
const SMARTCAT_API_BASE = 'https://smartcat.com/api/integration/v1';

async function getSmartcatAuth() {
    const accountId = Deno.env.get('SMARTCAT_ACCOUNT_ID');
    const apiKey = Deno.env.get('SMARTCAT_API_KEY');
    
    if (!accountId || !apiKey) {
        throw new Error('Smartcat credentials not configured');
    }
    
    return 'Basic ' + btoa(`${accountId}:${apiKey}`);
}

async function smartcatFetch(endpoint, options = {}) {
    const auth = await getSmartcatAuth();
    const url = endpoint.startsWith('http') ? endpoint : `${SMARTCAT_API_BASE}${endpoint}`;
    
    console.log(`Smartcat API call: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': auth,
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    
    const text = await response.text();
    console.log(`Smartcat response status: ${response.status}`);
    
    if (!response.ok) {
        console.log(`Smartcat error: ${text}`);
        throw new Error(`Smartcat API error: ${response.status} - ${text.substring(0, 200)}`);
    }
    
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || (user.role !== 'admin' && user.role !== 'project_manager')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { action, params } = body;

        // ==================== GET ACCOUNT INFO ====================
        if (action === 'get_account') {
            const account = await smartcatFetch('/account');
            return Response.json({ account });
        }

        // ==================== GET PROJECTS LIST ====================
        if (action === 'get_projects') {
            const { limit = 100, includeCompleted = true } = params || {};
            
            // Get project list
            const projects = await smartcatFetch('/project/list');
            
            // Return relevant data
            const projectList = (Array.isArray(projects) ? projects : []).slice(0, limit).map(p => ({
                id: p.id,
                name: p.name,
                status: p.status,
                sourceLanguage: p.sourceLanguageId || p.sourceLanguage,
                targetLanguages: p.targetLanguageIds || p.targetLanguages || [],
                createdDate: p.creationDate,
                deadline: p.deadline,
                clientName: p.externalTag || p.clientId,
                documentsCount: p.documents?.length || 0
            }));
            
            return Response.json({ 
                projects: projectList,
                total: projectList.length
            });
        }

        // ==================== GET PROJECT DETAILS WITH JOBS ====================
        if (action === 'get_project_details') {
            const { projectId } = params || {};
            if (!projectId) {
                return Response.json({ error: 'projectId required' }, { status: 400 });
            }
            
            const project = await smartcatFetch(`/project/${projectId}`);
            
            // Extract assignees from documents
            const assignees = new Map();
            for (const doc of (project.documents || [])) {
                for (const stage of (doc.workflowStages || [])) {
                    for (const exec of (stage.executives || [])) {
                        if (exec.id && !assignees.has(exec.id)) {
                            assignees.set(exec.id, {
                                id: exec.id,
                                name: exec.supplierName || 'Unknown',
                                stageType: stage.stageType,
                                progress: stage.progress,
                                wordsCount: stage.wordsTranslated || 0
                            });
                        }
                    }
                }
            }
            
            return Response.json({
                project: {
                    id: project.id,
                    name: project.name,
                    status: project.status,
                    sourceLanguage: project.sourceLanguageId,
                    targetLanguages: project.targetLanguageIds,
                    deadline: project.deadline
                },
                documents: (project.documents || []).map(d => ({
                    id: d.id,
                    name: d.name,
                    wordsCount: d.wordsCount,
                    status: d.status,
                    stages: (d.workflowStages || []).map(s => ({
                        type: s.stageType,
                        status: s.status,
                        progress: s.progress,
                        executives: s.executives || []
                    }))
                })),
                assignees: Array.from(assignees.values())
            });
        }

        // ==================== GET ALL TEAM MEMBERS FROM PROJECTS ====================
        if (action === 'get_team_from_projects') {
            const { limit = 50 } = params || {};
            
            // Get recent projects
            const projects = await smartcatFetch('/project/list');
            const recentProjects = (Array.isArray(projects) ? projects : []).slice(0, limit);
            
            // Extract all unique assignees
            const teamMembers = new Map();
            const projectAssignments = [];
            
            for (const project of recentProjects) {
                // Get project details to see assignees
                try {
                    const details = await smartcatFetch(`/project/${project.id}`);
                    
                    for (const doc of (details.documents || [])) {
                        for (const stage of (doc.workflowStages || [])) {
                            for (const exec of (stage.executives || [])) {
                                const execId = exec.id;
                                if (!execId) continue;
                                
                                if (!teamMembers.has(execId)) {
                                    teamMembers.set(execId, {
                                        smartcat_id: execId,
                                        name: exec.supplierName || 'Unknown',
                                        projectCount: 0,
                                        languages: new Set(),
                                        stageTypes: new Set()
                                    });
                                }
                                
                                const member = teamMembers.get(execId);
                                member.projectCount++;
                                if (details.targetLanguageIds) {
                                    details.targetLanguageIds.forEach(l => member.languages.add(l));
                                }
                                member.stageTypes.add(stage.stageType);
                                
                                projectAssignments.push({
                                    execId,
                                    projectId: project.id,
                                    projectName: project.name,
                                    docName: doc.name,
                                    stageType: stage.stageType,
                                    wordsCount: doc.wordsCount
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.log(`Error getting project ${project.id}: ${e.message}`);
                }
            }
            
            // Convert to array
            const team = Array.from(teamMembers.values()).map(m => ({
                ...m,
                languages: Array.from(m.languages),
                stageTypes: Array.from(m.stageTypes)
            }));
            
            return Response.json({
                team,
                total: team.length,
                projectsScanned: recentProjects.length
            });
        }

        // ==================== GET COMPLETED JOBS FOR PAYMENT ====================
        if (action === 'get_jobs_for_payment') {
            const { dateFrom, dateTo, projectIds } = params || {};
            
            // Get projects
            const projects = await smartcatFetch('/project/list');
            let filteredProjects = Array.isArray(projects) ? projects : [];
            
            // Filter by date if provided
            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                filteredProjects = filteredProjects.filter(p => 
                    new Date(p.creationDate || p.deadline) >= fromDate
                );
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                filteredProjects = filteredProjects.filter(p => 
                    new Date(p.creationDate || p.deadline) <= toDate
                );
            }
            
            // Filter by project IDs if provided
            if (projectIds?.length) {
                filteredProjects = filteredProjects.filter(p => projectIds.includes(p.id));
            }
            
            // Get our freelancers for matching
            const freelancers = await base44.asServiceRole.entities.Freelancer.filter({ status: 'Approved' });
            const freelancerByName = new Map();
            const freelancerByEmail = new Map();
            
            for (const f of freelancers) {
                if (f.full_name) freelancerByName.set(f.full_name.toLowerCase(), f);
                if (f.email) freelancerByEmail.set(f.email.toLowerCase(), f);
            }
            
            // Collect job data
            const jobsByAssignee = new Map();
            
            for (const project of filteredProjects.slice(0, 30)) {
                try {
                    const details = await smartcatFetch(`/project/${project.id}`);
                    
                    for (const doc of (details.documents || [])) {
                        for (const stage of (doc.workflowStages || [])) {
                            // Only count completed stages
                            if (stage.status !== 'completed' && stage.progress < 100) continue;
                            
                            for (const exec of (stage.executives || [])) {
                                const assigneeName = exec.supplierName || 'Unknown';
                                const assigneeId = exec.id;
                                
                                if (!assigneeId) continue;
                                
                                if (!jobsByAssignee.has(assigneeId)) {
                                    // Try to match with Base44 freelancer
                                    const matchedFreelancer = freelancerByName.get(assigneeName.toLowerCase());
                                    
                                    jobsByAssignee.set(assigneeId, {
                                        smartcat_id: assigneeId,
                                        name: assigneeName,
                                        freelancer_id: matchedFreelancer?.id || null,
                                        freelancer_email: matchedFreelancer?.email || null,
                                        matched: !!matchedFreelancer,
                                        jobs: [],
                                        totalWords: 0
                                    });
                                }
                                
                                const assigneeData = jobsByAssignee.get(assigneeId);
                                const wordsCount = stage.wordsTranslated || doc.wordsCount || 0;
                                
                                assigneeData.jobs.push({
                                    projectId: project.id,
                                    projectName: project.name,
                                    documentName: doc.name,
                                    stageType: stage.stageType,
                                    sourceLanguage: details.sourceLanguageId,
                                    targetLanguage: doc.targetLanguageId,
                                    wordsCount,
                                    deadline: project.deadline
                                });
                                assigneeData.totalWords += wordsCount;
                            }
                        }
                    }
                } catch (e) {
                    console.log(`Error processing project ${project.id}: ${e.message}`);
                }
            }
            
            const result = Array.from(jobsByAssignee.values());
            
            return Response.json({
                assignees: result,
                total: result.length,
                totalWords: result.reduce((sum, a) => sum + a.totalWords, 0),
                projectsProcessed: Math.min(filteredProjects.length, 30)
            });
        }

        // ==================== SYNC TEAM TO BASE44 ====================
        if (action === 'sync_to_base44') {
            const { members } = params || {};
            
            if (!members?.length) {
                return Response.json({ error: 'No members to sync' }, { status: 400 });
            }
            
            const existingFreelancers = await base44.asServiceRole.entities.Freelancer.list();
            const existingByName = new Map(existingFreelancers.map(f => [f.full_name?.toLowerCase(), f]));
            
            let created = 0;
            let updated = 0;
            
            for (const member of members) {
                const nameLower = member.name?.toLowerCase();
                const existing = existingByName.get(nameLower);
                
                if (!existing) {
                    // Create new freelancer
                    await base44.asServiceRole.entities.Freelancer.create({
                        full_name: member.name,
                        status: 'Approved',
                        tags: ['Smartcat Team', 'Auto-synced'],
                        notes: `Synced from Smartcat on ${new Date().toISOString().split('T')[0]}. Smartcat ID: ${member.smartcat_id}`
                    });
                    created++;
                } else if (!existing.tags?.includes('Smartcat Team')) {
                    // Update tags
                    await base44.asServiceRole.entities.Freelancer.update(existing.id, {
                        tags: [...(existing.tags || []), 'Smartcat Team']
                    });
                    updated++;
                }
            }
            
            return Response.json({ created, updated, total: members.length });
        }

        // ==================== INVITE USER ====================
        if (action === 'invite_user') {
            const { email, name, message } = params || {};
            
            if (!email) {
                return Response.json({ error: 'Email required' }, { status: 400 });
            }
            
            // Create in Base44
            const existingFreelancers = await base44.asServiceRole.entities.Freelancer.filter({ email });
            
            if (existingFreelancers.length === 0) {
                await base44.asServiceRole.entities.Freelancer.create({
                    email,
                    full_name: name || email.split('@')[0],
                    status: 'New Application',
                    tags: ['Invited', 'Smartcat Invite'],
                    notes: `Invited on ${new Date().toISOString().split('T')[0]}`
                });
            }
            
            // Send invitation email
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: email,
                subject: 'Invitation to Join el turco Team',
                body: `
Hello${name ? ' ' + name : ''},

We would like to invite you to join our translation team at el turco.

${message || 'We offer regular work opportunities with competitive rates.'}

Please reply to this email if you are interested, and we will send you access to our Smartcat team.

Best regards,
el turco Team
                `.trim()
            });
            
            return Response.json({ 
                success: true, 
                message: 'Invitation sent',
                note: 'Please also invite via Smartcat dashboard for full access'
            });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });
        
    } catch (error) {
        console.error('Smartcat API error:', error);
        return Response.json({ 
            error: error.message,
            hint: 'Check Smartcat API credentials in settings'
        }, { status: 500 });
    }
});