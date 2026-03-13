import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AlertTriangle } from "lucide-react";

export default function DuplicateWarning({ email, fullName }) {
    const { data: matches = [] } = useQuery({
        queryKey: ['duplicateCheck', email, fullName],
        queryFn: async () => {
            if (!email && !fullName) return [];
            const results = [];
            if (email) {
                const byEmail = await base44.entities.Freelancer.filter({ email });
                results.push(...byEmail);
            }
            if (fullName && fullName.length > 2) {
                const byName = await base44.entities.Freelancer.filter({ full_name: fullName });
                const existingIds = new Set(results.map(r => r.id));
                byName.forEach(r => { if (!existingIds.has(r.id)) results.push(r); });
            }
            return results;
        },
        enabled: !!(email || (fullName && fullName.length > 2)),
        staleTime: 30000,
    });

    if (matches.length === 0) return null;

    return (
        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
                <h4 className="font-bold text-red-800 text-base">⚠️ Duplicate Entry Detected!</h4>
                <p className="text-red-700 text-sm mt-1">
                    A freelancer with matching details already exists in the system:
                </p>
                <ul className="mt-2 space-y-1">
                    {matches.map(m => (
                        <li key={m.id} className="text-sm text-red-700">
                            <span className="font-semibold">{m.full_name}</span> — {m.email} — Status: <span className="font-medium">{m.status}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}