import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertCircle, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function QuizPerformanceSummary({ attempts, quizzes }) {
    if (attempts.length === 0) {
        return (
            <Card className="bg-gray-50">
                <CardContent className="py-6">
                    <div className="flex items-center gap-3 text-gray-500">
                        <AlertCircle className="w-5 h-5" />
                        <div>
                            <p className="font-medium">No quiz attempts</p>
                            <p className="text-sm">Applicant has not taken any quizzes yet</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const passedAttempts = attempts.filter(a => a.passed === true);
    const failedAttempts = attempts.filter(a => a.passed === false);
    const avgScore = Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length);
    const bestScore = Math.max(...attempts.map(a => a.percentage));
    const isApprovalReady = passedAttempts.length > 0;

    return (
        <div className="space-y-4">
            {/* Approval Status Card */}
            {isApprovalReady ? (
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-green-900">Ready for Approval</p>
                                <p className="text-sm text-green-700">Has passed {passedAttempts.length} quiz{passedAttempts.length > 1 ? 'zes' : ''}</p>
                            </div>
                            <Badge className="bg-green-600 text-white text-lg px-4 py-1">
                                {bestScore}%
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-amber-900">Quiz Required</p>
                                <p className="text-sm text-amber-700">No passing quiz scores yet</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
                <Card>
                    <CardContent className="py-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{avgScore}%</div>
                        <div className="text-xs text-gray-600 mt-1">Average Score</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{passedAttempts.length}</div>
                        <div className="text-xs text-gray-600 mt-1">Passed</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4 text-center">
                        <div className="text-2xl font-bold text-red-600">{failedAttempts.length}</div>
                        <div className="text-xs text-gray-600 mt-1">Failed</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}