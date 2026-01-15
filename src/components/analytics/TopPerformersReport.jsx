import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Mail, Star, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function TopPerformersReport({ 
    performers, 
    title, 
    icon, 
    badgeColor, 
    onSendNotification,
    isLowPerformer = false 
}) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        {icon}
                        {title}
                    </CardTitle>
                    {performers.length > 0 && (
                        <Button variant="outline" size="sm" onClick={onSendNotification}>
                            <Mail className="w-4 h-4 mr-2" />
                            Send Bulk Email
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {performers.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>Freelancer</TableHead>
                                <TableHead className="text-center">Reports</TableHead>
                                <TableHead className="text-center">LQA</TableHead>
                                <TableHead className="text-center">QS</TableHead>
                                <TableHead className="text-center">Combined</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {performers.map((performer, idx) => (
                                <TableRow key={performer.freelancer_id}>
                                    <TableCell>
                                        {idx < 3 && !isLowPerformer ? (
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                idx === 1 ? 'bg-gray-300 text-gray-700' :
                                                'bg-amber-600 text-white'
                                            }`}>
                                                {idx + 1}
                                            </div>
                                        ) : (
                                            <span className="text-gray-500">{idx + 1}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{performer.freelancer_name}</p>
                                            <p className="text-xs text-gray-500">{performer.freelancer_email}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary">{performer.total_reports}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {performer.avg_lqa != null ? (
                                            <span className={
                                                performer.avg_lqa >= 85 ? 'text-green-600' :
                                                performer.avg_lqa >= 70 ? 'text-yellow-600' : 'text-red-600'
                                            }>
                                                {performer.avg_lqa.toFixed(1)}
                                            </span>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {performer.avg_qs != null ? (
                                            <span className="flex items-center justify-center gap-1">
                                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                {performer.avg_qs.toFixed(1)}
                                            </span>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className={badgeColor}>
                                            {performer.combined_score.toFixed(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Link to={createPageUrl(`FreelancerDetail?id=${performer.freelancer_id}`)}>
                                            <Button variant="ghost" size="icon">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <p>Not enough data</p>
                        <p className="text-xs">Need at least 2 reports per freelancer</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}