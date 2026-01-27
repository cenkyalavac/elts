import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Email Templates
const LOW_SCORE_FREELANCER_TEMPLATE = (fullName, combinedScore, threshold) => `
Dear ${fullName},

Based on your quality assessments, your Combined Score has been calculated as ${combinedScore.toFixed(1)}.
This score is below the established threshold (${threshold}).

To improve your quality performance:
- Review our translation quality guidelines
- Examine the feedback from previous LQA reports
- Ensure compliance with terminology and style guides

If you have any questions, please contact our quality management team.

Best regards,
el turco Quality Management
`.trim();

const LOW_SCORE_ADMIN_TEMPLATE = (fullName, combinedScore, threshold, totalAssessments) => `
Quality warning for ${fullName}:

Combined Score: ${combinedScore.toFixed(1)}
Probation Threshold: ${threshold}
Total Assessments: ${totalAssessments}

Please contact the freelancer and create a quality improvement plan.
`.trim();

const CONSECUTIVE_LOW_LQA_TEMPLATE = (fullName, scoresText) => `
Dear ${fullName},

You have received low scores in your last 3 LQA assessments:
${scoresText}

This is a serious warning regarding our quality standards.
Please contact our quality management team as soon as possible.

Best regards,
el turco Quality Management
`.trim();

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, freelancer_id, report_id } = await req.json();

        // Get settings
        const allSettings = await base44.asServiceRole.entities.QualitySettings.list();
        const settings = allSettings[0] || { probation_threshold: 70, lqa_weight: 4, qs_multiplier: 20 };

        if (action === 'check_and_notify') {
            // Require freelancer_id for targeted check
            if (!freelancer_id) {
                return Response.json({ error: 'freelancer_id is required' }, { status: 400 });
            }

            // Fetch only the specific freelancer and their reports in parallel
            const [freelancerResult, allReports, admins] = await Promise.all([
                base44.asServiceRole.entities.Freelancer.filter({ id: freelancer_id }),
                base44.asServiceRole.entities.QualityReport.filter({ freelancer_id: freelancer_id }),
                base44.asServiceRole.entities.User.filter({ role: 'admin' })
            ]);

            if (!freelancerResult || freelancerResult.length === 0) {
                return Response.json({ error: 'Freelancer not found' }, { status: 404 });
            }

            const freelancer = freelancerResult[0];
            const notifications = [];

            // Filter to only finalized/accepted reports
            const freelancerReports = allReports.filter(r => 
                r.status === 'finalized' || r.status === 'translator_accepted'
            );

                if (freelancerReports.length < 3) continue;

                // Calculate combined score
                const lqaScores = freelancerReports.filter(r => r.lqa_score != null).map(r => r.lqa_score);
                const qsScores = freelancerReports.filter(r => r.qs_score != null).map(r => r.qs_score);

                let combinedScore = null;
                const avgLqa = lqaScores.length > 0 ? lqaScores.reduce((a, b) => a + b, 0) / lqaScores.length : null;
                const avgQs = qsScores.length > 0 ? qsScores.reduce((a, b) => a + b, 0) / qsScores.length : null;

                if (avgLqa !== null && avgQs !== null) {
                    combinedScore = ((avgLqa * settings.lqa_weight) + (avgQs * settings.qs_multiplier)) / (settings.lqa_weight + 1);
                } else if (avgLqa !== null) {
                    combinedScore = avgLqa;
                } else if (avgQs !== null) {
                    combinedScore = avgQs * settings.qs_multiplier;
                }

                // Check for low scores
                if (combinedScore !== null && combinedScore < settings.probation_threshold) {
                    // Send notification to freelancer
                    const freelancerEmail = freelancer.email;
                    const emailBody = `
Dear ${freelancer.full_name},

Based on your quality assessments, your Combined Score has been calculated as ${combinedScore.toFixed(1)}.
This score is below the established threshold (${settings.probation_threshold}).

To improve your quality performance:
- Review our translation quality guidelines
- Examine the feedback from previous LQA reports
- Ensure compliance with terminology and style guides

If you have any questions, please contact our quality management team.

Best regards,
el turco Quality Management
                    `.trim();

                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: freelancerEmail,
                        subject: `Quality Warning - Combined Score: ${combinedScore.toFixed(1)}`,
                        body: emailBody
                    });

                    notifications.push({
                        type: 'freelancer_warning',
                        freelancer_id: freelancer.id,
                        freelancer_name: freelancer.full_name,
                        score: combinedScore
                    });

                    // Notify admins
                    for (const admin of admins) {
                        await base44.asServiceRole.integrations.Core.SendEmail({
                            to: admin.email,
                            subject: `[Admin Notice] Low Quality Score: ${freelancer.full_name}`,
                            body: `
Quality warning for ${freelancer.full_name}:

Combined Score: ${combinedScore.toFixed(1)}
Probation Threshold: ${settings.probation_threshold}
Total Assessments: ${freelancerReports.length}

Please contact the freelancer and create a quality improvement plan.
                            `.trim()
                        });
                    }
                }

            // Check for 3 consecutive low LQA scores
            const recentLqaReports = freelancerReports
                .filter(r => r.lqa_score != null)
                .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                .slice(0, 3);

            if (recentLqaReports.length >= 3) {
                const allLow = recentLqaReports.every(r => r.lqa_score < 70);
                if (allLow) {
                    notifications.push({
                        type: 'consecutive_low_lqa',
                        freelancer_id: freelancer.id,
                        freelancer_name: freelancer.full_name,
                        scores: recentLqaReports.map(r => r.lqa_score)
                    });

                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: freelancer.email,
                        subject: `Urgent Quality Warning - Consecutive Low LQA Scores`,
                        body: `
Dear ${freelancer.full_name},

You have received low scores in your last 3 LQA assessments:
${recentLqaReports.map((r, i) => `${i + 1}. LQA: ${r.lqa_score}`).join('\n')}

This is a serious warning regarding our quality standards.
Please contact our quality management team as soon as possible.

Best regards,
el turco Quality Management
                        `.trim()
                    });
                }
            }

            return Response.json({ 
                success: true, 
                notifications_sent: notifications.length,
                notifications 
            });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});