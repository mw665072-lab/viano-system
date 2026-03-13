"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const BillingCancelPage = () => {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#FDF8F8] flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-50 rounded-full blur-[120px] opacity-60" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-50 rounded-full blur-[120px] opacity-60" />
            </div>

            <Card className="max-w-[500px] w-full bg-white/80 backdrop-blur-xl border-0 shadow-[0_32px_64px_-16px_rgba(220,38,38,0.08)] rounded-[40px] p-8 md:p-12 text-center relative z-10">
                {/* Alert Icon */}
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
                    <XCircle className="w-12 h-12 text-red-500" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
                    Payment Cancelled
                </h1>
                
                <p className="text-gray-600 mb-10 leading-relaxed text-lg">
                    No worries! Your payment process was cancelled and no charges were made. You can try again whenever you're ready.
                </p>

                <div className="space-y-4">
                    <Button 
                        onClick={() => router.push('/profile')}
                        className="w-full h-14 bg-white border-2 border-gray-100 hover:bg-gray-50 text-gray-900 rounded-2xl font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Billing
                    </Button>

                    <div className="pt-6 flex items-center justify-center gap-2 px-6 py-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                        <ShieldAlert className="w-5 h-5 text-amber-600" />
                        <span className="text-sm text-amber-700 font-medium">Your data remains safe and secure.</span>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default BillingCancelPage;
