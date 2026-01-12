import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify admin access
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { csvData } = await req.json();
        
        if (!csvData || !Array.isArray(csvData)) {
            return Response.json({ error: 'Invalid CSV data' }, { status: 400 });
        }

        const imported = [];
        const errors = [];

        for (const row of csvData) {
            try {
                // Parse ServiceData
                const serviceData = row.ServiceData || '';
                const rates = [];
                
                if (serviceData) {
                    const services = serviceData.split(',').map(s => s.trim());
                    for (const service of services) {
                        const match = service.match(/(.+?)\s*->\s*(.+?);(.+?);(.+)/);
                        if (match) {
                            const [, serviceType, langPair, rateType, rateValue] = match;
                            const [source, target] = langPair.split('>').map(l => l.trim());
                            
                            rates.push({
                                source_language: source,
                                target_language: target,
                                rate_type: rateType.toLowerCase() === 'words' ? 'per_word' : 'per_hour',
                                rate_value: parseFloat(rateValue) || 0,
                                currency: row.Currency || 'USD',
                                specialization: serviceType.trim()
                            });
                        }
                    }
                }

                // Parse language pairs from ServiceData
                const languagePairs = [];
                const uniqueLangPairs = new Set();
                
                for (const rate of rates) {
                    const key = `${rate.source_language}>${rate.target_language}`;
                    if (!uniqueLangPairs.has(key)) {
                        uniqueLangPairs.add(key);
                        languagePairs.push({
                            source_language: rate.source_language,
                            target_language: rate.target_language,
                            proficiency: row.NativeLanguage === rate.target_language ? 'Native' : 'Professional'
                        });
                    }
                }

                // Parse software
                const software = row.Software ? row.Software.split(',').map(s => s.trim()).filter(Boolean) : [];
                
                // Parse categories
                const categories = row.Categories ? row.Categories.split(',').map(c => c.trim()).filter(Boolean) : [];
                
                // Parse tags
                const tags = row.Tags ? row.Tags.split(',').map(t => t.trim()).filter(Boolean) : [];

                // Parse address
                const address = {
                    address1: row.Address1 || '',
                    address2: row.Address2 || '',
                    city: row.City || '',
                    state: row.State || '',
                    zip: row.Zip || '',
                    country: row.Country || ''
                };

                // Parse payment info
                const paymentInfo = {
                    payment_terms_type: row.PaymentTermsType || '',
                    payment_terms_date: parseInt(row.PaymentTermsDate) || 0,
                    invoicing_threshold: parseFloat(row.InvoicingThreshhold) || 0,
                    bank_account_name: row.BankAccountName || '',
                    bank_account_number: row.BankAccountNumber || '',
                    bank_name: row.BankName || '',
                    bank_address: `${row.BankAddress1 || ''} ${row.BankAddress2 || ''}`.trim(),
                    bank_country: row.BankCountry || '',
                    iban: row.IBAN || '',
                    swift_code: row.SWIFTCode || '',
                    sort_code: row.SortCode || '',
                    paypal_id: row.PaypalID || ''
                };

                // Map old status to new status - ensure it's one of the valid enum values
                let status = row.Status ? String(row.Status).trim() : 'New Application';
                if (status === 'ACTIVE') status = 'Approved';
                if (status === 'INACTIVE') status = 'On Hold';
                if (status === 'New') status = 'New Application'; // Handle legacy "New" status
                // Validate status is in allowed enum
                const validStatuses = ['New Application', 'Form Sent', 'Price Negotiation', 'Test Sent', 'Approved', 'On Hold', 'Rejected', 'Red Flag'];
                if (!validStatuses.includes(status)) {
                    status = 'New Application'; // Default to New Application for invalid statuses
                }

                const freelancerData = {
                    full_name: `${row.ResourceFirstName || ''} ${row.ResourceLastName || ''}`.trim(),
                    resource_code: row.ResourceCode || '',
                    email: row.Email || '',
                    email2: row.Email2 || '',
                    phone: row.Phone1 || '',
                    phone2: row.Phone2 || '',
                    phone3: row.Phone3 || '',
                    address,
                    location: `${row.City || ''}, ${row.Country || ''}`.replace(', ,', '').trim(),
                    website: row.WWWAddress || '',
                    skype: row.Skype || '',
                    language_pairs: languagePairs,
                    native_language: row.NativeLanguage || '',
                    language_preference: row.LanguagePreference || '',
                    specializations: categories,
                    categories,
                    service_types: [],
                    software,
                    rates,
                    currency: row.Currency || 'USD',
                    availability: row.Availability || 'Immediate',
                    available_on: row.AvailableOn || null,
                    status,
                    resource_type: row.ResourceType || 'Freelancer',
                    notes: row.Notes || '',
                    special_instructions: row.SpecialInstructions || '',
                    tags,
                    payment_info: paymentInfo,
                    tax_info: {
                        vat_number: row.VATNumber || '',
                        tax_id: row.TaxId || ''
                    },
                    minimum_fee: parseFloat(row.MinimumFee) || 0,
                    minimum_project_fee: parseFloat(row.MinimumProjectFee) || 0,
                    resource_rating: parseFloat(row.ResourceRating) || 0,
                    resource_initial_rating: parseFloat(row.ResourceInitialRating) || 0,
                    nda: row.NDA === 'True' || row.NDA === true,
                    tested: row.Tested === 'True' || row.Tested === true,
                    certified: row.Certified === 'True' || row.Certified === true,
                    gender: row.Gender || '',
                    company_name: row.ResourceCompanyName || '',
                    date_added: row.DateAdded || null
                };

                // Only import if email exists
                if (freelancerData.email) {
                    // Check if already exists
                    const existing = await base44.asServiceRole.entities.Freelancer.filter({
                        email: freelancerData.email
                    });

                    if (existing.length === 0) {
                        await base44.asServiceRole.entities.Freelancer.create(freelancerData);
                        imported.push(freelancerData.full_name);
                    } else {
                        // Update existing record
                        await base44.asServiceRole.entities.Freelancer.update(
                            existing[0].id,
                            freelancerData
                        );
                        imported.push(`${freelancerData.full_name} (updated)`);
                    }
                }
            } catch (error) {
                errors.push({
                    row: row.ResourceFirstName + ' ' + row.ResourceLastName,
                    error: error.message
                });
            }
        }

        return Response.json({
            success: true,
            imported: imported.length,
            errors: errors.length,
            details: { imported, errors }
        });

    } catch (error) {
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});