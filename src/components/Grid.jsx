import { useState, useMemo } from 'react'
import SlotModal from './SlotModal'
import Legend from './Legend'
import { getConflictingTeams } from '../lib/parseRoomSchedule'

function parseSlotKey(key) {
  const m = key.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) return null
  return { year: +m[1], month: +m[2], date: +m[3], hour: +m[4], minute: +m[5] }
}

function slotToDateKey(key) {
  const p = parseSlotKey(key)
  if (!p) return ''
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.date).padStart(2, '0')}`
}

function slotToTimeKey(key) {
  const p = parseSlotKey(key)
  if (!p) return ''
  return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`
}

function getWeeks(slotKeys) {
  const byWeek = new Map()
  for (const k of slotKeys) {
    const p = parseSlotKey(k)
    if (!p) continue
    const d = new Date(p.year, p.month - 1, p.date)
    const sun = new Date(d)
    sun.setDate(d.getDate() - d.getDay())
    const weekKey = sun.toISOString().slice(0, 10)
    if (!byWeek.has(weekKey)) byWeek.set(weekKey, [])
    byWeek.get(weekKey).push(k)
  }
  return Array.from(byWeek.entries()).sort((a, b) => a[0].localeCompare(b[0]))
}

// 09:00 ~ 23:45 고정, 15분 단위 (00:00 전까지만 표시)
const FIXED_TIME_SLOTS = Array.from({ length: 60 }, (_, i) => {
  const totalMins = 9 * 60 + i * 15
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

export default function Grid({ data, settings, onSettingsChange, roomSchedule = [] }) {
  const { slotKeys, people } = data
  const { minPeople, totalPeople, requiredMember } = settings
  const weeks = useMemo(() => getWeeks(slotKeys), [slotKeys])
  const [weekIndex, setWeekIndex] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [recommendOnly, setRecommendOnly] = useState(false)

  const currentWeek = weeks[weekIndex]
  const weekKey = currentWeek?.[0]
  const weekSlotKeys = currentWeek?.[1] || []

  const timeSlots = FIXED_TIME_SLOTS

  const slotToPeople = useMemo(() => {
    const map = new Map()
    for (const p of people) {
      for (const slot of p.slots) {
        if (!map.has(slot)) map.set(slot, [])
        map.get(slot).push(p.displayName)
      }
    }
    return map
  }, [people])

  const dayKeys = useMemo(() => {
    const set = new Set()
    for (const k of weekSlotKeys) {
      set.add(slotToDateKey(k))
    }
    return Array.from(set).sort()
  }, [weekSlotKeys])

  const gridCells = useMemo(() => {
    const rows = []
    for (const time of timeSlots) {
      const row = []
      for (const dateKey of dayKeys) {
        const slotKey = `${dateKey}T${time}`
        const names = [...(slotToPeople.get(slotKey) || [])]
        const count = names.length
        const hasRequired = !requiredMember || names.includes(requiredMember)
        const meaningful = count >= minPeople && hasRequired
        row.push({ slotKey, names, count, meaningful })
      }
      rows.push({ time, cells: row })
    }
    return rows
  }, [timeSlots, dayKeys, slotToPeople, minPeople, requiredMember])

  const selectedCell = selectedSlot
    ? gridCells.flatMap((r) => r.cells).find((c) => c.slotKey === selectedSlot)
    : null

  const displayNames = useMemo(() => [...new Set(people.map((p) => p.displayName))], [people])

  const formatDateLabel = (dateKey) => {
    const [y, m, d] = dateKey.split('-').map(Number)
    const d2 = new Date(y, m - 1, d)
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    return `${m}/${d} ${weekdays[d2.getDay()]}`
  }

  const formatDateLabelShort = (dateKey) => {
    const [, m, d] = dateKey.split('-').map(Number)
    return `${m}/${d}`
  }

  if (!weekKey) {
    return <p className="text-slate-500">표시할 데이터가 없습니다.</p>
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-2 sm:justify-start">
        <button
          type="button"
          disabled={weekIndex <= 0}
          onClick={() => setWeekIndex((i) => i - 1)}
          className="min-h-[44px] rounded-xl border border-[var(--color-primary-border)] bg-[#FAFAFA] px-4 py-2.5 text-sm font-medium text-black disabled:opacity-40 active:bg-[var(--color-primary-light)] transition-colors touch-manipulation"
        >
          ← 이전 주
        </button>
        <span className="text-xs sm:text-sm text-black font-medium text-center flex-1 min-w-0 truncate px-1">
          {formatDateLabel(dayKeys[0])} ~ {formatDateLabel(dayKeys[dayKeys.length - 1])}
        </span>
        <button
          type="button"
          disabled={weekIndex >= weeks.length - 1}
          onClick={() => setWeekIndex((i) => i + 1)}
          className="min-h-[44px] rounded-xl border border-[var(--color-primary-border)] bg-[#FAFAFA] px-4 py-2.5 text-sm font-medium text-black disabled:opacity-40 active:bg-[var(--color-primary-light)] transition-colors touch-manipulation"
        >
          다음 주 →
        </button>
      </div>

      <Legend />

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-3 sm:gap-4 rounded-xl border border-[var(--color-primary-border)] bg-[#FAFAFA] p-3 text-sm">
          <label className="flex items-center gap-2 text-[var(--color-text)]">
            <span>최소 인원</span>
            <input
              type="number"
              min={1}
              max={20}
              value={minPeople}
              onChange={(e) => onSettingsChange({ minPeople: Number(e.target.value) })}
              className="w-14 rounded-lg border border-[var(--color-primary-border)] bg-white px-2 py-1.5 text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-[var(--color-text)]">
            <span>총 인원</span>
            <input
              type="number"
              min={1}
              max={20}
              value={totalPeople}
              onChange={(e) => onSettingsChange({ totalPeople: Number(e.target.value) })}
              className="w-14 rounded-lg border border-[var(--color-primary-border)] bg-white px-2 py-1.5 text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-[var(--color-text)]">
            <span>필수 멤버</span>
            <select
              value={requiredMember || ''}
              onChange={(e) => onSettingsChange({ requiredMember: e.target.value || null })}
              className="rounded-lg border border-[var(--color-primary-border)] bg-white px-2 py-1.5 text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-primary)]/30 outline-none"
            >
              <option value="">선택 안 함</option>
              {displayNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="col-span-2 sm:col-span-1 flex items-center gap-2 cursor-pointer text-[var(--color-text)] min-h-[44px] sm:min-h-0">
            <input
              type="checkbox"
              checked={recommendOnly}
              onChange={(e) => setRecommendOnly(e.target.checked)}
              className="rounded border-[var(--color-primary-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]/30 w-4 h-4 shrink-0"
            />
            <span>합주 가능만 보기</span>
          </label>
        </div>

      <div className="overflow-x-auto rounded-xl sm:rounded-2xl border border-[#E0DDD9] bg-[#FAFAFA] shadow-sm overflow-hidden -mx-1 sm:mx-0">
        <table className="w-full border-collapse text-xs sm:text-sm table-fixed [border-color:#E0DDD9]" style={{ minWidth: 420 }}>
          <colgroup>
            <col style={{ width: '4.5rem' }} />
            {dayKeys.map((dk) => (
              <col key={dk} style={{ width: dayKeys.length ? `calc((100% - 4.5rem) / ${dayKeys.length})` : undefined }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 border-b border-r border-[#E0DDD9] bg-white/90 px-3 sm:px-4 py-2 sm:py-3 text-center align-middle font-semibold text-[var(--color-text)] text-xs sm:text-sm backdrop-blur-sm">
                시간
              </th>
              {dayKeys.map((dk) => (
                <th
                  key={dk}
                  className="border-b border-l border-[#E0DDD9] bg-white/80 px-2.5 sm:px-4 py-2 sm:py-3 text-center font-semibold text-[var(--color-text)] text-[10px] sm:text-sm"
                >
                  <span className="hidden sm:inline">{formatDateLabel(dk)}</span>
                  <span className="sm:hidden">{formatDateLabelShort(dk)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gridCells.map((row) => (
              <tr key={row.time}>
                <td className="sticky left-0 z-10 border-b border-r border-[#E0DDD9] bg-white/70 px-3 sm:px-4 py-2.5 sm:py-3 text-[var(--color-text-muted)] whitespace-nowrap font-medium text-xs sm:text-sm backdrop-blur-sm min-h-[3rem] sm:min-h-[3.25rem]">
                  {row.time}
                </td>
                {row.cells.map((cell) => (
                  <td
                    key={cell.slotKey}
                    onClick={() => setSelectedSlot(cell.slotKey)}
                    className={`border-b border-l px-2.5 sm:px-4 py-2.5 sm:py-3 cursor-pointer min-h-[3rem] sm:min-h-[3.25rem] align-top transition-colors touch-manipulation ${
                      recommendOnly && !cell.meaningful
                        ? 'border-[#E0DDD9] bg-white/40 opacity-50'
                        : cell.meaningful
                        ? 'border-[#681993]/25 bg-[var(--color-primary-light)] hover:bg-[var(--color-primary)]/20'
                        : cell.count > 0
                        ? 'border-[#E0DDD9] bg-white/70 hover:bg-[#E0DDD9]/60'
                        : 'border-[#E0DDD9] bg-white/50 hover:bg-[#E0DDD9]/50'
                    }`}
                  >
                    <div className="font-semibold text-[var(--color-text)] text-xs sm:text-sm">
                      {cell.count}명
                      {cell.meaningful && getConflictingTeams(cell.slotKey, roomSchedule).length > 0 && (
                        <span className="ml-0.5" aria-label="시간 조율 필요">🚨</span>
                      )}
                    </div>
                    <div className="text-[10px] sm:text-xs text-[var(--color-text-muted)] truncate" title={cell.names.join(', ')}>
                      {cell.names.join(', ')}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSlot && selectedCell && (
        <SlotModal
          slotKey={selectedSlot}
          names={selectedCell.names}
          conflictingTeams={getConflictingTeams(selectedSlot, roomSchedule)}
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </div>
  )
}
