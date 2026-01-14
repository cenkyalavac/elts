import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Star, Zap, Target, TrendingUp, Trophy, Crown, Medal } from "lucide-react";

const iconMap = {
    Award, Star, Zap, Target, TrendingUp, Trophy, Crown, Medal
};

const colorClasses = {
    gold: "bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900",
    silver: "bg-gradient-to-br from-gray-300 to-gray-500 text-gray-800",
    bronze: "bg-gradient-to-br from-orange-400 to-orange-600 text-orange-900",
    blue: "bg-gradient-to-br from-blue-400 to-blue-600 text-blue-900",
    green: "bg-gradient-to-br from-green-400 to-green-600 text-green-900",
    purple: "bg-gradient-to-br from-purple-400 to-purple-600 text-purple-900",
    red: "bg-gradient-to-br from-red-400 to-red-600 text-red-900"
};

export default function BadgeDisplay({ badge, earned = false, earnedDate }) {
    const Icon = iconMap[badge.icon] || Award;

    return (
        <Card className={`relative overflow-hidden transition-all ${earned ? 'scale-100' : 'scale-95 opacity-50 grayscale'}`}>
            <CardContent className="p-4">
                <div className={`w-16 h-16 rounded-full ${colorClasses[badge.color] || colorClasses.blue} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                    <Icon className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-center text-sm mb-1">{badge.name}</h3>
                <p className="text-xs text-gray-600 text-center mb-2">{badge.description}</p>
                {earned && earnedDate && (
                    <Badge variant="outline" className="text-xs w-full justify-center">
                        Earned {new Date(earnedDate).toLocaleDateString()}
                    </Badge>
                )}
                {!earned && (
                    <Badge variant="outline" className="text-xs w-full justify-center bg-gray-50">
                        Not earned yet
                    </Badge>
                )}
            </CardContent>
        </Card>
    );
}