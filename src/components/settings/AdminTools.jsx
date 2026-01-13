import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, FileText, Users, Upload, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function AdminTools() {
    const tools = [
        {
            name: 'User Management',
            description: 'Manage user accounts, roles, and permissions',
            icon: Users,
            page: 'UserManagement',
            color: 'blue'
        },
        {
            name: 'Quiz Management',
            description: 'Create and manage freelancer assessment quizzes',
            icon: FileText,
            page: 'QuizManagement',
            color: 'purple'
        },
        {
            name: 'Import Freelancers',
            description: 'Bulk import freelancers from CSV or other sources',
            icon: Upload,
            page: 'ImportFreelancers',
            color: 'green'
        },
        {
            name: 'Open Positions',
            description: 'Manage open job positions and requirements',
            icon: Briefcase,
            page: 'OpenPositions',
            color: 'orange'
        }
    ];

    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        purple: 'bg-purple-100 text-purple-600',
        green: 'bg-green-100 text-green-600',
        orange: 'bg-orange-100 text-orange-600'
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                    <Card key={tool.page} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg ${colorClasses[tool.color]}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-xl mb-2">{tool.name}</CardTitle>
                                    <CardDescription>{tool.description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Link to={createPageUrl(tool.page)}>
                                <Button className="w-full">
                                    Open {tool.name}
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}