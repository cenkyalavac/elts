import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const CurrencyContext = createContext();

export const RATE_TYPES = {
    per_word: { label: 'Per Word', symbol: '/word', icon: '📝' },
    per_hour: { label: 'Per Hour', symbol: '/hr', icon: '⏰' },
    per_page: { label: 'Per Page', symbol: '/page', icon: '📄' },
    per_minute: { label: 'Per Minute', symbol: '/min', icon: '⏱️' },
    per_project: { label: 'Per Project', symbol: '/project', icon: '📦' },
    per_1000_words: { label: 'Per 1000 Words', symbol: '/1k', icon: '📚' },
    per_source_word: { label: 'Per Source Word', symbol: '/src word', icon: '📝' },
    per_target_word: { label: 'Per Target Word', symbol: '/tgt word', icon: '📝' },
    per_character: { label: 'Per Character', symbol: '/char', icon: '🔤' },
    per_line: { label: 'Per Line', symbol: '/line', icon: '📏' },
    per_day: { label: 'Per Day', symbol: '/day', icon: '📅' },
    per_half_day: { label: 'Per Half Day', symbol: '/half day', icon: '🌓' },
    minimum_fee: { label: 'Minimum Fee', symbol: ' min', icon: '💰' }
};

export function CurrencyProvider({ children }) {
    const { data: rates, isLoading, refetch } = useQuery({
        queryKey: ['exchangeRates'],
        queryFn: async () => {
            const response = await base44.functions.invoke('getExchangeRates');
            return response.data;
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
        refetchInterval: 1000 * 60 * 30, // Refresh every 30 minutes
        retry: 3
    });

    const convertToUSD = (amount, fromCurrency) => {
        if (!rates?.rates || !amount) return null;
        if (fromCurrency === 'USD') return amount;
        
        const rate = rates.rates[fromCurrency];
        if (!rate) return null;
        
        return amount / rate;
    };

    const convertFromUSD = (amountInUSD, toCurrency) => {
        if (!rates?.rates || !amountInUSD) return null;
        if (toCurrency === 'USD') return amountInUSD;
        
        const rate = rates.rates[toCurrency];
        if (!rate) return null;
        
        return amountInUSD * rate;
    };

    const formatCurrency = (amount, currency = 'USD', decimals = 2) => {
        if (amount === null || amount === undefined) return '-';
        
        const symbols = {
            USD: '$', EUR: '€', GBP: '£', TRY: '₺', 
            JPY: '¥', CNY: '¥', INR: '₹', BRL: 'R$',
            CHF: 'CHF', CAD: 'C$', AUD: 'A$'
        };
        
        const symbol = symbols[currency] || currency + ' ';
        return `${symbol}${amount.toFixed(decimals)}`;
    };

    const value = {
        rates: rates?.rates || {},
        lastUpdated: rates?.date,
        isLoading,
        convertToUSD,
        convertFromUSD,
        formatCurrency,
        refetch
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}

// Utility component to display a rate in USD
export function RateDisplay({ rate, showOriginal = true, className = '' }) {
    const { convertToUSD, formatCurrency, isLoading } = useCurrency();
    
    if (!rate || !rate.rate_value) return <span className="text-gray-400">-</span>;
    
    const originalCurrency = rate.currency || 'USD';
    const usdValue = convertToUSD(rate.rate_value, originalCurrency);
    const rateType = RATE_TYPES[rate.rate_type] || { symbol: '' };
    
    if (isLoading) {
        return <span className="text-gray-400 animate-pulse">...</span>;
    }
    
    return (
        <span className={className}>
            <span className="font-semibold text-green-600">
                {formatCurrency(usdValue, 'USD')}{rateType.symbol}
            </span>
            {showOriginal && originalCurrency !== 'USD' && (
                <span className="text-gray-500 text-xs ml-1">
                    ({formatCurrency(rate.rate_value, originalCurrency)})
                </span>
            )}
        </span>
    );
}

// Component to show all rates for a freelancer in USD
export function FreelancerRatesUSD({ freelancer, compact = false }) {
    const { convertToUSD, formatCurrency, isLoading, rates } = useCurrency();
    
    if (!freelancer?.language_pairs || freelancer.language_pairs.length === 0) {
        return <span className="text-gray-400 text-sm">No rates</span>;
    }

    // Collect all rates from all language pairs
    const allRates = [];
    freelancer.language_pairs.forEach(pair => {
        if (pair.rates) {
            pair.rates.forEach(rate => {
                allRates.push({
                    ...rate,
                    langPair: `${pair.source_language}-${pair.target_language}`
                });
            });
        }
    });

    // Also check top-level rates array
    if (freelancer.rates) {
        freelancer.rates.forEach(rate => {
            allRates.push(rate);
        });
    }

    if (allRates.length === 0) {
        return <span className="text-gray-400 text-sm">No rates</span>;
    }

    if (isLoading) {
        return <span className="text-gray-400 animate-pulse text-sm">Loading rates...</span>;
    }

    // Group rates by type
    const ratesByType = {};
    allRates.forEach(rate => {
        const type = rate.rate_type || 'per_word';
        if (!ratesByType[type]) {
            ratesByType[type] = [];
        }
        const usdValue = convertToUSD(rate.rate_value, rate.currency || 'USD');
        ratesByType[type].push({
            ...rate,
            usdValue
        });
    });

    // Get min/max for each type
    const rateSummary = Object.entries(ratesByType).map(([type, typeRates]) => {
        const values = typeRates.map(r => r.usdValue).filter(v => v !== null);
        const min = Math.min(...values);
        const max = Math.max(...values);
        return { type, min, max, count: values.length };
    });

    // Sort by priority: per_word first, then per_hour, then others
    const priorityOrder = ['per_word', 'per_hour', 'per_page', 'per_day', 'per_minute', 'per_project'];
    rateSummary.sort((a, b) => {
        const aIdx = priorityOrder.indexOf(a.type);
        const bIdx = priorityOrder.indexOf(b.type);
        if (aIdx === -1 && bIdx === -1) return 0;
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
    });

    if (compact) {
        // Show multiple rate types in compact view
        const displayRates = rateSummary.slice(0, 2);
        if (displayRates.length === 0) return <span className="text-gray-400">-</span>;
        
        return (
            <div className="flex flex-wrap gap-2">
                {displayRates.map(({ type, min, max }) => {
                    const typeInfo = RATE_TYPES[type] || { symbol: '', icon: '💵' };
                    return (
                        <span key={type} className="font-semibold text-green-600 text-sm">
                            {formatCurrency(min, 'USD')}
                            {min !== max && `-${formatCurrency(max, 'USD').replace('$', '')}`}
                            {typeInfo.symbol}
                        </span>
                    );
                })}
                {rateSummary.length > 2 && (
                    <span className="text-gray-500 text-xs">+{rateSummary.length - 2} more</span>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-1.5">
            {rateSummary.map(({ type, min, max }) => {
                const typeInfo = RATE_TYPES[type] || { label: type, symbol: '', icon: '💵' };
                return (
                    <div key={type} className="flex items-center gap-2 text-sm">
                        <span className="text-base">{typeInfo.icon}</span>
                        <span className="text-gray-600 min-w-[100px]">{typeInfo.label}:</span>
                        <span className="font-semibold text-green-600">
                            {formatCurrency(min, 'USD')}
                            {min !== max && ` - ${formatCurrency(max, 'USD')}`}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// Exchange rate display widget
export function ExchangeRateWidget({ currencies = ['EUR', 'GBP', 'TRY'] }) {
    const { rates, lastUpdated, isLoading, refetch } = useCurrency();
    
    if (isLoading) {
        return (
            <div className="text-xs text-gray-500 animate-pulse">
                Loading rates...
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 text-xs text-gray-600">
            <span className="font-medium">1 USD =</span>
            {currencies.map(curr => (
                <span key={curr}>
                    {rates[curr]?.toFixed(2)} {curr}
                </span>
            ))}
            {lastUpdated && (
                <span className="text-gray-400">
                    Updated: {lastUpdated}
                </span>
            )}
        </div>
    );
}