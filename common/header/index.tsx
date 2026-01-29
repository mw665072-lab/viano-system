"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Plus, Bell, Menu } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getStoredUserInfo, authAPI } from "@/lib/api"
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
                        const user = await authAPI.getUser(storedInfo.userId)
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

    // Profile section that appears on the right
    const profileSection = (
        <div className="flex items-center gap-3">
            <Button
                onClick={() => router.push('/profile')}
                variant="ghost"
                className="flex items-center gap-3 px-3 py-2 h-auto rounded-full hover:bg-gray-50 transition-colors"
            >
                <Avatar className="h-9 w-9 border border-gray-200">
                    {userData.profileImage ? (
                        <AvatarImage src={userData.profileImage} alt={userData.fullName} />
                    ) : null}
                    <AvatarFallback className="bg-gray-100 text-gray-600 text-sm font-medium">
                        {userData.initials}
                    </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-semibold text-[#0C1D38] leading-tight">{fullDisplayName}</span>
                    <span className="text-xs text-[#6B7280] leading-tight">View Profile</span>
                </div>
            </Button>

            <Button
                onClick={() => router.push('/notifications')}
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 rounded-full hover:bg-gray-50 border border-gray-200"
            >
                <Bell className="h-5 w-5 text-[#FFC107]" />
            </Button>
        </div>
    )

    return (
        <div className="w-full bg-white">
            {/* Mobile header with logo and menu */}
            <div className="flex lg:hidden items-center justify-between px-4 py-3 border-b border-gray-100">
                <Image
                    src="/Logo Web.svg"
                    alt="Viano Systems"
                    width={100}
                    height={32}
                    priority
                    className="h-8 w-auto"
                />
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleSidebar}
                    className="h-9 w-9"
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </div>

            {/* Main header content */}
            <header className={`flex items-center justify-between px-4 lg:px-6 py-4 ${className}`}>
                <div className="flex items-center gap-4">
                    {showBack && (backHref ? backLink : backButton)}
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl lg:text-2xl font-semibold leading-none text-[#1E1E1E]" style={{ fontFamily: 'Manrope' }}>
                            {title}
                        </h1>
                        {title.toLowerCase().includes('welcome') && <span className="text-xl lg:text-2xl">👋</span>}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {actionButton}
                    {showProfileSection && profileSection}
                </div>
            </header>
        </div>
    )
}
