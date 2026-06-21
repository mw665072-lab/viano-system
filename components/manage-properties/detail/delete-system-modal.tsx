"use client"

import { useState } from "react"
import { X, Trash2, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { systemsAPI, SystemResponse } from "@/lib/api"

interface DeleteSystemModalProps {
    propertyId: string
    system: SystemResponse
    onClose: () => void
    onSuccess: (deletedAlertCount: number, supersededAlertCount: number) => void
}

function formatSystemType(type: string) {
    return type
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
}

export function DeleteSystemModal({ propertyId, system, onClose, onSuccess }: DeleteSystemModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const label = [formatSystemType(system.system_type), system.name].filter(Boolean).join(' — ')

    const handleDelete = async () => {
        setIsSubmitting(true)
        setError(null)

        try {
            const res = await systemsAPI.deleteSystem(propertyId, system.system_id)
            onSuccess(res.deleted_alert_count, res.superseded_alert_count)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete system")
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1a1a1a] border border-transparent dark:border-white/10 rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-md shadow-red-100">
                            <Trash2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#0C1D38] dark:text-white">Delete System</h2>
                            <p className="text-xs text-[#64748B] dark:text-gray-400 font-medium">This action cannot be undone</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        disabled={isSubmitting}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 rounded-xl p-3 text-sm text-red-700 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <p className="text-sm text-[#334155] dark:text-gray-300">
                        Are you sure you want to delete <span className="font-semibold text-[#0C1D38] dark:text-white">{label}</span>?
                    </p>

                    <div className="flex gap-3 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-800 dark:text-amber-400 space-y-1">
                            <p>This permanently removes the system, its replacement history, and any pending alerts.</p>
                            <p>If an alert was already scheduled with the SMS provider earlier today, that one message may still send.</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-white/10 flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 rounded-xl h-11 text-sm font-semibold"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDelete}
                        className="flex-1 rounded-xl h-11 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Deleting...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Trash2 className="w-4 h-4" />
                                Delete System
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
