"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"

interface PageHeaderProps {
    title: string
    showBack?: boolean
    backHref?: string
    onBack?: () => void
    actionLabel?: string
    onAction?: () => void
    actionHref?: string
    actionIcon?: React.ReactNode
    actionVariant?: "default" | "secondary" | "destructive" | "outline" | "ghost"
    className?: string
}

export function PageHeader({
    title,
    showBack = true,
    backHref,
    onBack,
    actionLabel,
    onAction,
    actionHref,
    actionIcon = <Plus className="w-4 h-4" />,
    actionVariant = "default",
    className = "",
}: PageHeaderProps) {
    const backButton = (
        <button
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-muted transition-colors"
            aria-label="Go back"
        >
            <ArrowLeft className="w-5 h-5" />
        </button>
    )

    const backLink = backHref ? (
        <Link
            href={backHref}
            className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-muted transition-colors"
            aria-label="Go back"
        >
            <ArrowLeft className="w-5 h-5" />
        </Link>
    ) : null

    const actionButton = actionLabel && (
        <>
            {actionHref ? (
                <Link href={actionHref} className="group">
                    <Button
                        variant={actionVariant}
                        className="gap-2.5 w-[200px] h-[48px] rounded-full py-2 px-5 border-0 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        style={{ background: '#00346C' }}
                    >
                        <span className="transition-transform group-hover:rotate-90 duration-300">{actionIcon}</span>
                        {actionLabel}
                    </Button>
                </Link>
            ) : (
                <Button
                    onClick={onAction}
                    variant={actionVariant}
                    className="gap-2.5 w-[200px] h-[48px] rounded-full py-2 px-5 border-0 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    style={{ background: '#00346C' }}
                >
                    {actionIcon}
                    {actionLabel}
                </Button>
            )}
        </>
    )

    return (
        <header className={`flex items-center w-[95%] justify-between  py-4  ${className}`}>
            <div className="flex items-center gap-4">
                {showBack && (backHref ? backLink : backButton)}
                <h1 className="text-2xl font-semibold leading-none text-[#1E1E1E]" style={{ fontFamily: 'Manrope' }}>{title}</h1>
            </div>
            {actionButton}
        </header>
    )
}
