import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function ConversionFunnel({ data }) {
    const maxValue = Math.max(...data.map(d => d.count));
    
    return (
        <Card className="border-0 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                    </div>
                    Conversion Funnel
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.map((item, idx) => {
                        const width = (item.count / maxValue) * 100;
                        const conversion = idx > 0 ? ((item.count / data[idx - 1].count) * 100).toFixed(0) : 100;
                        
                        return (
                            <div key={idx}>
                                <div className="flex justify-between mb-1">
                                    <span className="font-medium text-sm text-gray-700">{item.stage}</span>
                                    <span className="text-sm text-gray-600">{item.count} ({conversion}%)</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                                    <div 
                                        className="h-8 rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 flex items-center justify-end pr-3 transition-all"
                                        style={{ width: `${width}%` }}
                                    >
                                        {width > 15 && <span className="text-white text-xs font-bold">{width.toFixed(0)}%</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}