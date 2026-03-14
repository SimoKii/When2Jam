export default function Legend() {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-5 rounded-xl border border-[#E0DDD9] bg-[#FAFAFA] p-4 text-sm">
      <span className="font-semibold text-[var(--color-text)]">범례</span>
      <span className="flex items-center gap-2 text-[var(--color-text-muted)]">
        <span className="inline-block h-6 w-10 rounded-lg bg-white/50 border border-[#E0DDD9]" />
        없음
      </span>
      <span className="flex items-center gap-2 text-[var(--color-text-muted)]">
        <span className="inline-block h-6 w-10 rounded-lg bg-white/70 border border-[#E0DDD9]" />
        1명 이상
      </span>
      <span className="flex items-center gap-2 text-[var(--color-text)]">
        <span className="inline-block h-6 w-10 rounded-lg bg-[var(--color-primary-light)] border border-[#681993]/25" />
        합주 가능
      </span>
    </div>
  )
}
