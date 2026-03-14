import { useEffect } from 'react'
import { getRoleByDisplayName, ROLE_EMOJI, ROLE_ORDER } from '../constants/band'

function formatSlotLabel(slotKey) {
  const m = slotKey?.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) return { datePart: slotKey || '', timePart: '' }
  const [, y, mo, d, h, min] = m
  const date = new Date(Number(y), Number(mo) - 1, Number(d))
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const datePart = `${y}년 ${Number(mo)}월 ${Number(d)}일 (${weekdays[date.getDay()]})`
  const timePart = `${h}:${min}`
  return { datePart, timePart }
}

function selectedByRole(names) {
  if (!names?.length) return { roleLines: [], others: [] }
  const byRole = new Map()
  const others = []
  for (const name of names) {
    const role = getRoleByDisplayName(name)
    if (role) {
      if (!byRole.has(role)) byRole.set(role, [])
      byRole.get(role).push(name)
    } else {
      others.push(name)
    }
  }
  const roleLines = ROLE_ORDER.filter((r) => byRole.has(r)).map((role) => ({
    role,
    emoji: ROLE_EMOJI[role],
    names: byRole.get(role),
  }))
  const linesByEmoji = roleLines.reduce((acc, { emoji, names: roleNames }) => {
    if (acc.length > 0 && acc[acc.length - 1].emoji === emoji) {
      acc[acc.length - 1].names.push(...roleNames)
    } else {
      acc.push({ emoji, names: [...roleNames] })
    }
    return acc
  }, [])
  return { linesByEmoji, others }
}

export default function SlotModal({ slotKey, names = [], conflictingTeams = [], onClose }) {
  const { linesByEmoji, others } = selectedByRole(names)
  const { datePart, timePart } = formatSlotLabel(slotKey)

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm min-h-screen min-h-[100dvh] overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="slot-modal-title"
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[var(--color-bg)] shadow-xl border border-[var(--color-primary-border)] overflow-hidden max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-1 flex items-center justify-between sticky top-0 bg-[var(--color-bg)]">
          <h2 id="slot-modal-title" className="text-lg font-semibold text-[var(--color-text)]">
            합주 가능 인원
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-black hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 active:bg-[var(--color-primary)]/20 transition-colors touch-manipulation"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="px-4 sm:px-5 pb-3 sm:pb-4 text-sm text-[var(--color-primary)] font-medium">
          {datePart} {timePart}
        </p>
        <div className="px-4 sm:px-5 pb-6 pt-0">
          {names.length === 0 ? (
            <p className="text-[var(--color-text-muted)]">가능한 사람 없음</p>
          ) : (
            <ul className="space-y-3">
              {linesByEmoji.map(({ emoji, names: roleNames }, i) => (
                <li key={`${emoji}-${i}`} className="flex items-baseline gap-2">
                  <span className="text-xl" aria-hidden>{emoji}:</span>
                  <span className="font-medium text-black">{roleNames.join(', ')}</span>
                </li>
              ))}
              {others.length > 0 && (
                <li className="flex items-baseline gap-2">
                  <span className="text-[var(--color-text-muted)] text-sm">참가자</span>
                  <span className="font-medium text-black">{others.join(', ')}</span>
                </li>
              )}
            </ul>
          )}
          {conflictingTeams?.length > 0 && (
            <>
              <hr className="border-[var(--color-primary-border)] my-4" />
              <p className="text-sm font-medium text-[var(--color-text)] mb-1.5">시간 조율 필요</p>
              <p className="text-sm text-[var(--color-text-muted)]">{conflictingTeams.join(', ')}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
