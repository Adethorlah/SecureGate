import { PageCenter } from "@/components/layout/PageCenter"

export default function Loading() {
  return (
    <PageCenter>
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--color-accent)] border-t-transparent rounded-full" />
      </div>
    </PageCenter>
  )
}
