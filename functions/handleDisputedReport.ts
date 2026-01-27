import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { report_id, action, comments } = await req.json();

        if (!report_id) {
            return Response.json({ error: 'Report ID required' }, { status: 400 });
        }

        // Get the report
        const reports = await base44.asServiceRole.entities.QualityReport.filter({ id: report_id });
        const report = reports[0];

        if (!report) {
            return Response.json({ error: 'Report not found' }, { status: 404 });
        }

        // Get freelancer info
        const freelancers = await base44.asServiceRole.entities.Freelancer.filter({ id: report.freelancer_id });
        const freelancer = freelancers[0];

        // Get settings
        const allSettings = await base44.asServiceRole.entities.QualitySettings.list();
        const settings = allSettings[0] || { dispute_period_days: 7 };

        if (action === 'dispute') {
            // Translator is disputing the report
            if (report.status !== 'pending_translator_review') {
                return Response.json({ error: 'Report cannot be disputed in current status' }, { status: 400 });
            }

            // Require comments when disputing
            if (!comments || comments.trim() === '') {
                return Response.json({ error: 'Translator comments are required when disputing a report' }, { status: 400 });
            }

            // Update report status
            await base44.asServiceRole.entities.QualityReport.update(report_id, {
                status: 'translator_disputed',
                translator_comments: comments
            });

            // Get all admins and senior PMs for review assignment
            const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
            const pms = await base44.asServiceRole.entities.User.filter({ role: 'project_manager' });
            const reviewers = [...admins, ...pms];

            // Send notification to all reviewers
            for (const reviewer of reviewers) {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: reviewer.email,
                    subject: `[Dispute Notice] LQA Report Disputed - ${freelancer?.full_name || 'Unknown'}`,
                    body: `
A quality report has been disputed and requires your review.

Translator: ${freelancer?.full_name || 'Unknown'}
Project: ${report.project_name || 'Not specified'}
Report Type: ${report.report_type}
LQA Score: ${report.lqa_score || '-'}
QS Score: ${report.qs_score || '-'}

Translator's Dispute:
${comments || 'No comments provided'}

Reviewer Comments:
${report.reviewer_comments || 'No comments'}

Please review the report and provide your final decision.

Report Link: ${Deno.env.get('APP_URL') ? `${Deno.env.get('APP_URL')}/QualityReportDetail?id=${report_id}` : '(Access via Dashboard)'}
                    `.trim()
                });
            }

            // Notify the original reviewer
            if (report.reviewer_id) {
                const reviewerUsers = await base44.asServiceRole.entities.User.filter({ id: report.reviewer_id });
                const originalReviewer = reviewerUsers[0];
                
                if (originalReviewer) {
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: originalReviewer.email,
                        subject: `[Notice] Your Report Has Been Disputed`,
                        body: `
Your quality report has been disputed by the translator.

Translator: ${freelancer?.full_name || 'Unknown'}
Project: ${report.project_name || 'Not specified'}

Translator's Dispute:
${comments || 'No comments provided'}

The report has been assigned to senior PMs for review.
                        `.trim()
                    });
                }
            }

            // Log the dispute action
            await logAction(base44, {
                actorId: user.id,
                actorEmail: user.email,
                actionType: 'QUALITY_REPORT_DISPUTED',
                targetEntity: 'QualityReport',
                targetId: report_id,
                metadata: { 
                    freelancer_id: report.freelancer_id,
                    freelancer_name: freelancer?.full_name,
                    project_name: report.project_name,
                    lqa_score: report.lqa_score,
                    qs_score: report.qs_score
                }
            });

            return Response.json({ 
                success: true, 
                message: 'Report disputed and assigned for review',
                reviewers_notified: reviewers.length
            });
        }

        if (action === 'finalize') {
            // Admin/PM finalizing the disputed report
            if (user.role !== 'admin' && user.role !== 'project_manager') {
                return Response.json({ error: 'Only admins and PMs can finalize reports' }, { status: 403 });
            }

            if (report.status !== 'translator_disputed' && report.status !== 'pending_final_review') {
                return Response.json({ error: 'Report cannot be finalized in current status' }, { status: 400 });
            }

            await base44.asServiceRole.entities.QualityReport.update(report_id, {
                status: 'finalized',
                final_reviewer_comments: comments,
                finalization_date: new Date().toISOString()
            });

            // Notify freelancer about final decision
            if (freelancer?.email) {
                const scoreLines = [];
                if (report.lqa_score != null) scoreLines.push(`LQA Score: ${report.lqa_score}`);
                if (report.qs_score != null) scoreLines.push(`QS Score: ${report.qs_score}`);
                const scoresText = scoreLines.length > 0 ? scoreLines.join('\n') : '';

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: freelancer.email,
                    subject: `[Final Decision] Quality Report Finalized`,
                    body: `
Dear ${freelancer.full_name},

Your disputed quality report has been reviewed and a final decision has been made.

Project: ${report.project_name || 'Not specified'}${scoresText ? '\n' + scoresText : ''}

Final Assessment:
${comments || 'No comments provided'}

If you have any questions, please contact our quality management team.

Best regards,
el turco Quality Management
                    `.trim()
                });
            }

            // Log the finalization action
            await logAction(base44, {
                actorId: user.id,
                actorEmail: user.email,
                actionType: 'QUALITY_REPORT_FINALIZED',
                targetEntity: 'QualityReport',
                targetId: report_id,
                metadata: { 
                    freelancer_id: report.freelancer_id,
                    freelancer_name: freelancer?.full_name,
                    project_name: report.project_name,
                    final_comments: comments,
                    old_status: report.status,
                    new_status: 'finalized'
                }
            });

            return Response.json({ 
                success: true, 
                message: 'Report finalized'
            });
        }

        if (action === 'accept') {
            // Translator accepting the report
            if (report.status !== 'pending_translator_review') {
                return Response.json({ error: 'Report cannot be accepted in current status' }, { status: 400 });
            }

            await base44.asServiceRole.entities.QualityReport.update(report_id, {
                status: 'translator_accepted',
                finalization_date: new Date().toISOString()
            });

            return Response.json({ 
                success: true, 
                message: 'Report accepted'
            });
        }

        if (action === 'submit_for_review') {
            // Reviewer submitting report to translator
            if (user.role !== 'admin' && user.role !== 'project_manager') {
                return Response.json({ error: 'Only admins and PMs can submit reports' }, { status: 403 });
            }

            const reviewDeadline = new Date();
            reviewDeadline.setDate(reviewDeadline.getDate() + settings.dispute_period_days);

            await base44.asServiceRole.entities.QualityReport.update(report_id, {
                status: 'pending_translator_review',
                submission_date: new Date().toISOString(),
                review_deadline: reviewDeadline.toISOString()
            });

            // Notify freelancer
            if (freelancer?.email) {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: freelancer.email,
                    subject: `[Review Required] Quality Assessment Report`,
                    body: `
Dear ${freelancer.full_name},

A quality assessment report has been created for you and is awaiting your review.

Project: ${report.project_name || 'Not specified'}
Report Type: ${report.report_type}
LQA Score: ${report.lqa_score || '-'}
QS Score: ${report.qs_score || '-'}

Reviewer Comments:
${report.reviewer_comments || 'No comments'}

You have ${settings.dispute_period_days} days to accept or dispute this report.
Deadline: ${reviewDeadline.toLocaleDateString('en-US')}

If no response is received within this period, the report will be automatically accepted.

Best regards,
el turco Quality Management
                    `.trim()
                });
            }

            return Response.json({ 
                success: true, 
                message: 'Report submitted for translator review',
                deadline: reviewDeadline.toISOString()
            });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});