"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Plus, Menu } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getStoredUserInfo, authAPI } from "@/lib/api"
import { ThemeToggle } from "@/common/theme/theme-toggle"
import Image from "next/image"

interface UserData {
    firstName: string
    fullName: string
    initials: string
    profileImage?: string
}

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
    onToggleSidebar?: () => void
    showProfileSection?: boolean
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
    onToggleSidebar,
    showProfileSection = false,
}: PageHeaderProps) {
    const router = useRouter()
    const [userData, setUserData] = useState<UserData>({
        firstName: 'User',
        fullName: 'User',
        initials: 'U',
        profileImage: undefined,
    })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const storedInfo = getStoredUserInfo()

                if (storedInfo.name) {
                    const nameParts = storedInfo.name.split(' ')
                    const firstName = nameParts[0] || 'User'
                    const initials = nameParts.map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

                    setUserData({
                        firstName,
                        fullName: storedInfo.name,
                        initials,
                        profileImage: undefined,
                    })
                } else if (storedInfo.userId) {
                    try {
                        const user = await authAPI.getUser()
                        const firstName = user.first_name || 'User'
                        const lastName = user.last_name || ''
                        const fullName = `${firstName} ${lastName}`.trim() || 'User'
                        const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'U'

                        if (typeof window !== 'undefined') {
                            localStorage.setItem('userName', fullName)
                        }

                        setUserData({
                            firstName,
                            fullName,
                            initials,
                            profileImage: undefined,
                        })
                    } catch (err) {
                        console.log('Could not fetch user data from API')
                    }
                }
            } catch (err) {
                console.error('Error loading user data:', err)
            } finally {
                setIsLoading(false)
            }
        }

        loadUserData()
    }, [])

    const fullDisplayName = isLoading ? '...' : userData.fullName

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

    // Profile section that appears on the right
    const profileSection = (
        <div className="flex items-center gap-3">
            <Button
                onClick={() => router.push('/profile')}
                variant="ghost"
                className="flex items-center gap-3 px-3 py-2 h-auto rounded-full hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
            >
                <Avatar className="h-9 w-9 border border-gray-200 dark:border-white/15">
                    {userData.profileImage ? (
                        <AvatarImage src={userData.profileImage} alt={userData.fullName} />
                    ) : null}
                    <AvatarFallback className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-sm font-medium">
                        {userData.initials}
                    </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-semibold text-[#0C1D38] dark:text-white leading-tight">{fullDisplayName}</span>
                    <span className="text-xs text-[#6B7280] dark:text-gray-400 leading-tight">View Profile</span>
                </div>
            </Button>

        </div>
    )

    return (
        <div className="w-full bg-white dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-white/10">
            {/* Mobile header with logo and menu */}
            <div className="flex lg:hidden items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10">
                <Image
                    src="/logo-dark.svg"
                    alt="Viano Systems"
                    width={155}
                    height={52}
                    priority
                    className="h-11 w-auto dark:hidden"
                />
                <Image
                    src="/Logo.svg"
                    alt="Viano Systems"
                    width={155}
                    height={52}
                    priority
                    className="h-11 w-auto hidden dark:block"
                />
                <div className="flex items-center gap-2.5">
                    {/* Primary action */}
                    {actionLabel && (
                        actionHref ? (
                            <Link
                                href={actionHref}
                                onClick={onAction}
                                aria-label={actionLabel}
                                className="inline-flex items-center justify-center gap-2 h-11 w-11 sm:w-auto sm:px-4 rounded-xl bg-[#E8730A] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="hidden sm:inline">{actionLabel}</span>
                            </Link>
                        ) : (
                            <button
                                onClick={onAction}
                                aria-label={actionLabel}
                                className="inline-flex items-center justify-center gap-2 h-11 w-11 sm:w-auto sm:px-4 rounded-xl bg-[#E8730A] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="hidden sm:inline">{actionLabel}</span>
                            </button>
                        )
                    )}
                    <button
                        onClick={onToggleSidebar}
                        aria-label="Open menu"
                        className="h-11 w-11 flex items-center justify-center rounded-xl text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
            </div>

            {/* Main header content - hidden on mobile for manage-properties */}
            <header className={`hidden lg:flex items-center justify-between px-6 py-5 ${className}`}>
                <div className="flex items-center gap-4">
                    {showBack && (backHref ? backLink : backButton)}
                    {/* Title */}
                    <h1 className="text-2xl lg:text-3xl font-bold text-[#1a1a2e] dark:text-white">
                        {title}
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <ThemeToggle variant="light" />
                    {/* Primary action */}
                    {actionLabel && (
                        actionHref ? (
                            <Link
                                href={actionHref}
                                onClick={onAction}
                                className="group inline-flex items-center gap-2 h-10 rounded-xl px-5 border border-[#D9D9D9] bg-[#E8730A] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                            >
                                <span className="transition-transform group-hover:rotate-90 duration-300">{actionIcon}</span>
                                {actionLabel}
                            </Link>
                        ) : (
                            <button
                                onClick={onAction}
                                className="group inline-flex items-center gap-2 h-10 rounded-xl px-5 border border-[#D9D9D9] bg-[#E8730A] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                            >
                                <span className="transition-transform group-hover:rotate-90 duration-300">{actionIcon}</span>
                                {actionLabel}
                            </button>
                        )
                    )}

                    {/* Optional profile section */}
                    {showProfileSection && profileSection}
                </div>
            </header>
        </div>
    )
}
