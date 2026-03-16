"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const BillingSuccessContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('session_id');
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            router.push('/dashboard');
        }
    }, [countdown, router]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60" />
            </div>

            <Card className="max-w-[500px] w-full bg-white/80 backdrop-blur-xl border-0 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[40px] p-8 md:p-12 text-center relative z-10 overflow-hidden">
                {/* Success Animation Background */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400" />
                
                {/* Icon Container */}
                <div className="relative mb-8">
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto animate-bounce-subtle">
                        <CheckCircle className="w-12 h-12 text-green-500" />
                    </div>
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-[30%] animate-pulse">
                        <Sparkles className="w-5 h-5 text-amber-400 opacity-50" />
                    </div>
                    <div className="absolute bottom-4 left-[30%] animate-pulse delay-700">
                        <Sparkles className="w-4 h-4 text-blue-400 opacity-50" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
                    Payment Successful!
                </h1>
                
                <p className="text-gray-600 mb-8 leading-relaxed">
                    Thank you for your subscription. Your account has been upgraded to <span className="font-bold text-gray-900">Pro Plan</span>. You can now analyze unlimited properties.
                </p>

                <div className="space-y-4">
                    <Button 
                        onClick={() => router.push('/dashboard')}
                        className="w-full h-14 bg-[#00346C] hover:bg-[#002855] text-white rounded-2xl font-semibold shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        Go to Dashboard
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                    
                    <div className="pt-4 flex items-center justify-center gap-2 text-sm text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Redirecting in {countdown} seconds...</span>
                    </div>
                </div>

                {/* Session Info (Subtle) */}
                {sessionId && (
                    <p className="mt-8 text-[10px] text-gray-300 font-mono break-all opacity-50">
                        Session: {sessionId}
                    </p>
                )}
            </Card>

            <style jsx global>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

const BillingSuccessPage = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        }>
            <BillingSuccessContent />
        </Suspense>
    );
};

export default BillingSuccessPage;
