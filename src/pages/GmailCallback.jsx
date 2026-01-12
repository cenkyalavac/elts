import React, { useEffect } from 'react';
import { Loader2 } from "lucide-react";

export default function GmailCallbackPage() {
    useEffect(() => {
        // The backend function handles everything, just show loading
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Connecting Gmail...</h2>
                <p className="text-gray-600">Please wait while we complete the connection.</p>
            </div>
        </div>
    );
}