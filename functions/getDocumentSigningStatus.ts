import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get all active documents (latest versions only)
        const documents = await base44.asServiceRole.entities.Document.filter({
            is_active: true,
            is_latest_version: true,
            required_for_approval: true
        });

        // Get all freelancers
        const freelancers = await base44.asServiceRole.entities.Freelancer.list(undefined, 1000);

        // Get all signatures
        const signatures = await base44.asServiceRole.entities.DocumentSignature.list(undefined, 10000);

        // Build status matrix
        const statusData = {
            documents: [],
            freelancers_count: freelancers.length,
            total_signatures_required: documents.length * freelancers.length,
            total_signatures_signed: 0,
            compliance_by_document: {},
            compliance_by_freelancer: {},
            overall_compliance: 0
        };

        // Calculate per-document compliance
        documents.forEach(doc => {
            const docSignatures = signatures.filter(s => s.document_id === doc.id && s.status === 'signed');
            const compliance = freelancers.length > 0 
                ? Math.round((docSignatures.length / freelancers.length) * 100) 
                : 0;

            statusData.documents.push({
                id: doc.id,
                title: doc.title,
                type: doc.type,
                version: doc.version,
                signed_count: docSignatures.length,
                total_count: freelancers.length,
                compliance_percent: compliance,
                unsigned_freelancers: freelancers
                    .filter(f => !docSignatures.find(s => s.freelancer_id === f.id))
                    .map(f => ({ id: f.id, name: f.full_name, email: f.email }))
            });

            statusData.compliance_by_document[doc.title] = compliance;
            statusData.total_signatures_signed += docSignatures.length;
        });

        // Calculate per-freelancer compliance
        freelancers.forEach(freelancer => {
            const freelancerSignatures = signatures.filter(
                s => s.freelancer_id === freelancer.id && s.status === 'signed'
            );
            const compliance = documents.length > 0 
                ? Math.round((freelancerSignatures.length / documents.length) * 100)
                : 0;

            statusData.compliance_by_freelancer[freelancer.full_name] = {
                email: freelancer.email,
                signed_count: freelancerSignatures.length,
                total_required: documents.length,
                compliance_percent: compliance,
                status: compliance === 100 ? 'complete' : compliance === 0 ? 'pending' : 'in_progress'
            };
        });

        // Calculate overall compliance
        statusData.overall_compliance = statusData.total_signatures_required > 0
            ? Math.round((statusData.total_signatures_signed / statusData.total_signatures_required) * 100)
            : 0;

        return Response.json(statusData);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});