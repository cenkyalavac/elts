import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Calculate Value Index: (Quality Score ^ 2) / (Rate * 100)
// Higher quality is heavily rewarded, higher rates are penalized
function calculateValueIndex(qualityScore, rate) {
    if (!qualityScore || !rate || rate <= 0) return null;
    return Math.round((Math.pow(qualityScore, 2) / (rate * 100)) * 100) / 100;
}

// Get primary translation rate (per word in USD)
function getPrimaryRate(freelancer) {
    if (!freelancer.rates || freelancer.rates.length === 0) return null;
    
    // Prioritize per_word rates for Translation service
    const perWordRate = freelancer.rates.find(r => 
        r.rate_type === 'per_word' && 
        r.rate_value > 0
    );
    
    if (perWordRate) {
        // Convert to USD if needed (simplified - assumes USD for now)
        return perWordRate.rate_value;
    }
    
    // Fallback to any rate with a value
    const anyRate = freelancer.rates.find(r => r.rate_value > 0);
    return anyRate?.rate_value || null;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify admin access for manual triggers
        const user = await base44.auth.me();
        if (user && user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }
        
        // Get all approved freelancers
        const freelancers = await base44.asServiceRole.entities.Freelancer.filter({ status: 'Approved' });
        
        const results = {
            processed: 0,
            updated: 0,
            skipped: 0,
            errors: []
        };
        
        for (const freelancer of freelancers) {
            results.processed++;
            
            try {
                const qualityScore = freelancer.combined_quality_score;
                const rate = getPrimaryRate(freelancer);
                
                if (!qualityScore || !rate) {
                    results.skipped++;
                    continue;
                }
                
                const valueIndex = calculateValueIndex(qualityScore, rate);
                
                if (valueIndex !== null && valueIndex !== freelancer.value_index) {
                    await base44.asServiceRole.entities.Freelancer.update(freelancer.id, {
                        value_index: valueIndex
                    });
                    results.updated++;
                } else {
                    results.skipped++;
                }
            } catch (error) {
                results.errors.push({ freelancer_id: freelancer.id, error: error.message });
            }
        }
        
        return Response.json({
            success: true,
            message: `Processed ${results.processed} freelancers, updated ${results.updated}`,
            results
        });
    } catch (error) {
        console.error('Error calculating freelancer metrics:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});