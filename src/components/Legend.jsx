export default function Legend() {
  return (
    <div className="w-fit max-w-full flex flex-wrap items-center gap-2 sm:gap-3 rounded-lg border border-[var(--color-primary-border)] bg-[var(--color-bg)] px-2.5 py-2 sm:px-3 sm:py-2.5 text-xs sm:text-sm">
      <span className="font-semibold text-[var(--color-text)]">표시</span>
      <span className="flex items-center gap-1.5 sm:gap-2 text-[var(--color-text-muted)]">
        <span className="inline-block h-4 w-6 sm:h-5 sm:w-8 rounded bg-white/50 border border-[var(--color-primary-border)]" />
        <span>없음</span>
      </span>
      <span className="flex items-center gap-1.5 sm:gap-2 text-[var(--color-text-muted)]">
        <span className="inline-block h-4 w-6 sm:h-5 sm:w-8 rounded bg-white/70 border border-[var(--color-primary-border)]" />
        <span>1명 이상</span>
      </span>
      <span className="flex items-center gap-1.5 sm:gap-2 text-[var(--color-text)]">
        <span className="inline-block h-4 w-6 sm:h-5 sm:w-8 rounded bg-[var(--color-primary-light)] border border-[var(--color-primary-border-tint)]" />
        <span>합주 가능</span>
      </span>
    </div>
  )
}
