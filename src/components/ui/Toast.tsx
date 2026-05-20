"use client"

import { useEffect, useState } from "react"

type ToastType = "success" | "error"

type ToastProps = {
  id: string
  message: string
  type: ToastType
  onDismiss: (id: string) => void
}

export function Toast({ id, message, type, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(id), 300)
    }, 5000)
    return () => clearTimeout(timer)
  }, [id, onDismiss])

  const bg =
    type === "success"
      ? "bg-[var(--color-success-bg)] border-[var(--color-success)] text-[var(--color-success)]"
      : "bg-[var(--color-error-bg)] border-[var(--color-error)] text-[var(--color-error)]"

  return (
    <div
      role="alert"
      className={`rounded-[var(--radius-sm)] border px-4 py-3 text-sm shadow-[var(--shadow-md)] transition-all duration-300 ${bg} ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex-1">{message}</span>
        <button
          type="button"
          onClick={() => {
            setVisible(false)
            setTimeout(() => onDismiss(id), 300)
          }}
          className="text-current opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
