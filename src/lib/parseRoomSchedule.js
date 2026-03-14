// 동방 시간표 CSV 파서 (캘린더 형식: 날짜 행 + "HH:MM~HH:MM 팀명" 행)

function parseCsvRows(text) {
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') inQuotes = false
      else cell += c
      continue
    }
    if (c === '"') {
      inQuotes = true
      continue
    }
    if (c === ',' || c === '\t') {
      row.push(cell.trim())
      cell = ''
      continue
    }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell.trim())
      if (row.some((s) => s.length > 0)) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += c
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim())
    if (row.some((s) => s.length > 0)) rows.push(row)
  }
  return rows
}

function parseCellEntries(cellText) {
  if (!cellText || typeof cellText !== 'string') return []
  const entries = []
  const regex = /(\d{1,2}):(\d{2})~(\d{1,2}):(\d{2})\s*([^\n]*?)(?=\s*\d{1,2}:\d{2}~|$)/g
  let m
  while ((m = regex.exec(cellText)) !== null) {
    const team = m[5].trim().replace(/\s+/g, ' ')
    if (team) entries.push({ start: `${m[1].padStart(2, '0')}:${m[2]}`, end: `${m[3].padStart(2, '0')}:${m[4]}`, team })
  }
  return entries
}

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function timeOverlaps(slotHhmm, startHhmm, endHhmm) {
  const t = timeToMinutes(slotHhmm)
  const s = timeToMinutes(startHhmm)
  const e = timeToMinutes(endHhmm)
  return t >= s && t < e
}

export function parseRoomScheduleCsv(csvText, year = 2026) {
  const rows = parseCsvRows(csvText)
  if (rows.length < 4) return []

  let month = 3
  let headerRowIndex = -1
  for (let r = 0; r < Math.min(5, rows.length); r++) {
    const row = rows[r]
    const first = (row[0] || '').trim()
    if (first === '3월' || first.match(/^\d+월$/)) {
      const mm = first.match(/(\d+)/)
      if (mm) month = parseInt(mm[1], 10)
    }
    const hasDays = row.some((c) => ['일', '월', '화', '수', '목', '금', '토'].includes((c || '').trim()))
    if (hasDays && headerRowIndex === -1) headerRowIndex = r
  }

  if (headerRowIndex === -1) return []
  const headerRow = rows[headerRowIndex]
  let dayColStart = headerRow.findIndex((c) => (c || '').trim() === '일')
  if (dayColStart === -1) dayColStart = 0
  const dayColumns = 7
  const reservations = []
  let dayRowIndex = headerRowIndex + 1
  while (dayRowIndex + 1 < rows.length) {
    const dayRow = rows[dayRowIndex]
    const contentRow = rows[dayRowIndex + 1]
    for (let col = dayColStart; col < dayColStart + dayColumns && col < dayRow.length && col < contentRow.length; col++) {
      const dayNum = parseInt(String(dayRow[col]).trim(), 10)
      if (Number.isNaN(dayNum) || dayNum < 1 || dayNum > 31) continue
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
      const cellText = contentRow[col] || ''
      const entries = parseCellEntries(cellText)
      for (const { start, end, team } of entries) {
        reservations.push({ date: dateStr, start, end, team })
      }
    }
    dayRowIndex += 2
  }
  return reservations
}

export function getConflictingTeams(slotKey, reservations) {
  if (!slotKey || !Array.isArray(reservations) || reservations.length === 0) return []
  const m = slotKey.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{1,2}):(\d{2})/)
  if (!m) return []
  const date = `${m[1]}-${m[2]}-${m[3]}`
  const time = `${m[4].padStart(2, '0')}:${m[5]}`
  const teams = new Set()
  for (const r of reservations) {
    if (r.date === date && timeOverlaps(time, r.start, r.end)) teams.add(r.team)
  }
  return [...teams]
}
