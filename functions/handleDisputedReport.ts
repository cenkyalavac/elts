import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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
                    subject: `[İtiraz Bildirimi] LQA Raporu İtiraz Edildi - ${freelancer?.full_name || 'Bilinmiyor'}`,
                    body: `
Bir kalite raporu itiraz edildi ve incelemenizi bekliyor.

Çevirmen: ${freelancer?.full_name || 'Bilinmiyor'}
Proje: ${report.project_name || 'Belirtilmemiş'}
Rapor Tipi: ${report.report_type}
LQA Skoru: ${report.lqa_score || '-'}
QS Skoru: ${report.qs_score || '-'}

Çevirmen İtirazı:
${comments || 'Yorum eklenmemiş'}

Reviewer Yorumu:
${report.reviewer_comments || 'Yorum yok'}

Lütfen raporu inceleyip final kararınızı verin.

Rapor Linki: ${Deno.env.get('APP_URL') ? `${Deno.env.get('APP_URL')}/QualityReportDetail?id=${report_id}` : '(Dashboard üzerinden erişebilirsiniz)'}
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
                        subject: `[Bilgilendirme] Oluşturduğunuz Rapor İtiraz Edildi`,
                        body: `
Oluşturduğunuz kalite raporu çevirmen tarafından itiraz edildi.

Çevirmen: ${freelancer?.full_name || 'Bilinmiyor'}
Proje: ${report.project_name || 'Belirtilmemiş'}

Çevirmen İtirazı:
${comments || 'Yorum eklenmemiş'}

Rapor kıdemli PM'ler tarafından incelenmek üzere atandı.
                        `.trim()
                    });
                }
            }

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
                if (report.lqa_score != null) scoreLines.push(`LQA Skoru: ${report.lqa_score}`);
                if (report.qs_score != null) scoreLines.push(`QS Skoru: ${report.qs_score}`);
                const scoresText = scoreLines.length > 0 ? scoreLines.join('\n') : '';

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: freelancer.email,
                    subject: `[Final Karar] Kalite Raporu Sonuçlandı`,
                    body: `
Sayın ${freelancer.full_name},

İtiraz ettiğiniz kalite raporu incelendi ve final karar verildi.

Proje: ${report.project_name || 'Belirtilmemiş'}${scoresText ? '\n' + scoresText : ''}

Final Değerlendirme:
${comments || 'Yorum eklenmemiş'}

Sorularınız için kalite yönetimi ekibimizle iletişime geçebilirsiniz.

Saygılarımızla,
el turco Kalite Yönetimi
                    `.trim()
                });
            }

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
                    subject: `[İncelemeniz Bekleniyor] Kalite Değerlendirme Raporu`,
                    body: `
Sayın ${freelancer.full_name},

Size ait bir kalite değerlendirme raporu oluşturuldu ve incelemenizi bekliyor.

Proje: ${report.project_name || 'Belirtilmemiş'}
Rapor Tipi: ${report.report_type}
LQA Skoru: ${report.lqa_score || '-'}
QS Skoru: ${report.qs_score || '-'}

Reviewer Yorumu:
${report.reviewer_comments || 'Yorum yok'}

${settings.dispute_period_days} gün içinde raporu kabul edebilir veya itiraz edebilirsiniz.
Son tarih: ${reviewDeadline.toLocaleDateString('tr-TR')}

Bu süre içinde yanıt verilmezse rapor otomatik olarak kabul edilmiş sayılacaktır.

Saygılarımızla,
el turco Kalite Yönetimi
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