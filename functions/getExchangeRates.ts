import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Free exchange rate API - no key needed
const EXCHANGE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch latest exchange rates
        const response = await fetch(EXCHANGE_API_URL);
        const data = await response.json();

        // Return rates for common currencies
        const rates = {
            base: 'USD',
            date: data.date,
            rates: {
                USD: 1,
                EUR: data.rates.EUR,
                GBP: data.rates.GBP,
                TRY: data.rates.TRY,
                CAD: data.rates.CAD,
                AUD: data.rates.AUD,
                CHF: data.rates.CHF,
                JPY: data.rates.JPY,
                CNY: data.rates.CNY,
                INR: data.rates.INR,
                BRL: data.rates.BRL,
                MXN: data.rates.MXN,
                PLN: data.rates.PLN,
                SEK: data.rates.SEK,
                NOK: data.rates.NOK,
                DKK: data.rates.DKK,
                RUB: data.rates.RUB,
                AED: data.rates.AED,
                SGD: data.rates.SGD,
                HKD: data.rates.HKD
            }
        };

        return Response.json(rates);
    } catch (error) {
        console.error('Exchange rate fetch error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});