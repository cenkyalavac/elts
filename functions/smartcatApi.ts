import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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
    
    console.log(`Smartcat API: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': auth,
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    
    const text = await response.text();
    
    if (!response.ok) {
        console.error(`Smartcat error ${response.status}: ${text}`);
        throw new Error(`Smartcat API error: ${response.status}`);
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

        // ==================== GET MY TEAM (from projects) ====================
        if (action === 'get_my_team') {
            // Smartcat doesn't have a direct team API, so we extract from projects
            const projects = await smartcatFetch('/project/list');
            const projectList = Array.isArray(projects) ? projects : [];
            
            console.log(`Found ${projectList.length} projects`);
            
            const teamMembers = new Map();
            
            // Scan recent projects to find all assignees
            for (const project of projectList.slice(0, 30)) {
                try {
                    const details = await smartcatFetch(`/project/${project.id}`);
                    
                    // Log first project structure for debugging
                    if (teamMembers.size === 0 && details.documents?.length > 0) {
                        const firstDoc = details.documents[0];
                        const firstStage = firstDoc?.workflowStages?.[0];
                        console.log('Sample document structure:', JSON.stringify({
                            docKeys: Object.keys(firstDoc || {}),
                            stageKeys: Object.keys(firstStage || {}),
                            executiveSample: firstStage?.executives?.[0] || 'no executives'
                        }));
                    }
                    
                    for (const doc of (details.documents || [])) {
                        for (const stage of (doc.workflowStages || [])) {
                            const executives = stage.executives || stage.assignees || [];
                            
                            for (const exec of executives) {
                                // Try multiple possible field names
                                const name = exec.supplierName || exec.name || exec.fullName || 
                                            exec.displayName || exec.userName || 
                                            (exec.firstName && exec.lastName ? `${exec.firstName} ${exec.lastName}` : null);
                                const email = exec.email || exec.supplierEmail || exec.userEmail;
                                const execId = exec.id || exec visibleId || exec.userId || exec.supplierId || name || `unknown_${Math.random()}`;
                                
                                if (!name && !email) {
                                    console.log('Executive without name/email:', JSON.stringify(exec));
                                    continue;
                                }
                                
                                if (!teamMembers.has(execId)) {
                                    teamMembers.set(execId, {
                                        smartcat_id: execId,
                                        name: name || 'Unknown',
                                        email: email || null,
                                        role: stage.stageType || stage.name || 'Unknown',
                                        projectCount: 0,
                                        languages: new Set(),
                                        rawData: exec // Keep for debugging
                                    });
                                }
                                
                                const member = teamMembers.get(execId);
                                member.projectCount++;
                                const targetLang = doc.targetLanguage || doc.targetLanguageId;
                                if (targetLang) member.languages.add(targetLang);
                            }
                        }
                    }
                } catch (e) {
                    console.log(`Skip project ${project.id}: ${e.message}`);
                }
            }
            
            console.log(`Found ${teamMembers.size} unique team members`);
            
            // Get freelancers for matching
            const freelancers = await base44.asServiceRole.entities.Freelancer.list();
            const freelancerByName = new Map();
            
            for (const f of freelancers) {
                if (f.full_name) freelancerByName.set(f.full_name.toLowerCase().trim(), f);
            }
            
            // Convert to array and match
            const team = Array.from(teamMembers.values()).map(m => {
                const matchedFreelancer = freelancerByName.get(m.name?.toLowerCase().trim());
                return {
                    smartcat_id: m.smartcat_id,
                    name: m.name,
                    email: m.email,
                    role: m.role,
                    projectCount: m.projectCount,
                    languages: Array.from(m.languages),
                    matched: !!matchedFreelancer,
                    freelancer_id: matchedFreelancer?.id || null,
                    freelancer_email: matchedFreelancer?.email || null,
                    _debug: m.rawData // Include raw data for debugging
                };
            });
            
            return Response.json({ 
                team,
                total: team.length,
                projectsScanned: Math.min(projectList.length, 30)
            });
        }

        // ==================== GET JOBS FOR PAYMENT ====================
        if (action === 'get_jobs_for_payment') {
            const { dateFrom, dateTo } = params || {};
            
            const projects = await smartcatFetch('/project/list');
            let filteredProjects = Array.isArray(projects) ? projects : [];
            
            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                filteredProjects = filteredProjects.filter(p => {
                    const pDate = new Date(p.completedDate || p.deadline || p.creationDate);
                    return pDate >= fromDate;
                });
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59);
                filteredProjects = filteredProjects.filter(p => {
                    const pDate = new Date(p.completedDate || p.deadline || p.creationDate);
                    return pDate <= toDate;
                });
            }
            
            const freelancers = await base44.asServiceRole.entities.Freelancer.list();
            const freelancerByName = new Map();
            const freelancerByEmail = new Map();
            
            for (const f of freelancers) {
                if (f.full_name) freelancerByName.set(f.full_name.toLowerCase().trim(), f);
                if (f.email) freelancerByEmail.set(f.email.toLowerCase(), f);
            }
            
            const jobsByAssignee = new Map();
            
            for (const project of filteredProjects.slice(0, 50)) {
                try {
                    const details = await smartcatFetch(`/project/${project.id}`);
                    
                    for (const doc of (details.documents || [])) {
                        for (const stage of (doc.workflowStages || [])) {
                            if (stage.status !== 'completed' && stage.progress !== 100) continue;
                            
                            for (const exec of (stage.executives || [])) {
                                const assigneeName = exec.supplierName || 'Unknown';
                                const assigneeId = exec.id || assigneeName;
                                
                                if (!jobsByAssignee.has(assigneeId)) {
                                    const matchedFreelancer = freelancerByName.get(assigneeName.toLowerCase().trim());
                                    
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
                                    sourceLanguage: details.sourceLanguage,
                                    targetLanguage: doc.targetLanguage,
                                    wordsCount,
                                    deadline: project.deadline,
                                    completedDate: project.completedDate || project.deadline
                                });
                                assigneeData.totalWords += wordsCount;
                            }
                        }
                    }
                } catch (e) {
                    console.log(`Skip project ${project.id}: ${e.message}`);
                }
            }
            
            const result = Array.from(jobsByAssignee.values());
            
            return Response.json({
                assignees: result,
                total: result.length,
                totalWords: result.reduce((sum, a) => sum + a.totalWords, 0),
                projectsProcessed: Math.min(filteredProjects.length, 50)
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
            const existingByEmail = new Map(existingFreelancers.map(f => f.email ? [f.email.toLowerCase(), f] : null).filter(Boolean));
            
            let created = 0;
            let updated = 0;
            
            for (const member of members) {
                const nameLower = member.name?.toLowerCase().trim();
                const emailLower = member.email?.toLowerCase();
                const existing = existingByEmail.get(emailLower) || existingByName.get(nameLower);
                
                if (!existing) {
                    await base44.asServiceRole.entities.Freelancer.create({
                        full_name: member.name,
                        email: member.email || null,
                        status: 'Approved',
                        tags: ['Smartcat Team', 'Auto-synced'],
                        notes: `Synced from Smartcat on ${new Date().toISOString().split('T')[0]}`
                    });
                    created++;
                } else if (!existing.tags?.includes('Smartcat Team')) {
                    await base44.asServiceRole.entities.Freelancer.update(existing.id, {
                        tags: [...(existing.tags || []), 'Smartcat Team']
                    });
                    updated++;
                }
            }
            
            return Response.json({ created, updated, total: members.length });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });
        
    } catch (error) {
        console.error('Smartcat API error:', error);
        return Response.json({ 
            error: error.message,
            hint: 'Check Smartcat API credentials'
        }, { status: 500 });
    }
});