// when2meet CSV 파서 → slotKeys + people

const DEFAULT_NICKNAME_MAP = {
  먹기의신: '희은',
  예준희: '준희',
  박자의신: '준희',
  박준성: '준성',
  신재영: '재영',
  kiho: '기호',
};

function trimQuotes(s) {
  if (typeof s !== 'string') return s;
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))
    return t.slice(1, -1).trim();
  return t;
}

function toDisplayName(rawName, nicknameMap = DEFAULT_NICKNAME_MAP) {
  const key = trimQuotes(rawName).trim();
  return nicknameMap[key] ?? key;
}

function parseTimeHeaderParts(timeStr) {
  const s = String(timeStr).trim();
  const match = s.match(/(\w+)\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return null;
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = dayNames.indexOf(match[1].toLowerCase());
  if (dayIndex === -1) return null;
  let h = parseInt(match[2], 10);
  const m = parseInt(match[3], 10);
  if (match[5]) {
    if (match[5].toUpperCase() === 'PM' && h !== 12) h += 12;
    if (match[5].toUpperCase() === 'AM' && h === 12) h = 0;
  }
  return { dayIndex, hour: h, minute: m };
}

function parseDateTimeParts(timeStr) {
  const s = String(timeStr).trim();
  const match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;
  const month = parseInt(match[1], 10);
  const date = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  const hour = parseInt(match[4], 10);
  const minute = parseInt(match[5], 10);
  if (month < 1 || month > 12 || date < 1 || date > 31) return null;
  return { year, month, date, hour, minute };
}

function toSlotKeyFromParts(parts) {
  const { year, month, date, hour, minute } = parts;
  return `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function getWeekStart(d) {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay());
  x.setHours(0, 0, 0, 0);
  return x;
}

function toSlotKey(weekStart, dayIndex, hour, minute) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayIndex);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function detectFormat(rows) {
  if (!rows.length) return null;
  const first = rows[0];
  if (first.length < 2) return null;
  const firstCell = (first[0] || '').toString().trim().toLowerCase();
  const secondCell = (first[1] || '').toString().trim();
  if (firstCell === 'time' || firstCell.includes('time')) return 'B';
  if (!firstCell && secondCell && /[A-Za-z]+\s+\d{1,2}:\d{2}/.test(secondCell)) return 'A';
  if (first[0] === '' || firstCell === '') return 'A';
  return 'B';
}

export function parseCsvText(csvText, nicknameMap = DEFAULT_NICKNAME_MAP, options = {}) {
  const weekStart = options.weekStart ? getWeekStart(options.weekStart) : getWeekStart(new Date());
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { slotKeys: [], people: [] };
  const rows = lines.map((line) => {
    const result = [];
    let inQuotes = false;
    let cell = '';
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if ((c === ',' && !inQuotes) || (c === '\t' && !inQuotes)) {
        result.push(cell);
        cell = '';
      } else {
        cell += c;
      }
    }
    result.push(cell);
    return result;
  });

  const format = detectFormat(rows);
  if (!format) return { slotKeys: [], people: [] };

  if (format === 'A') {
    const headerRow = rows[0];
    const numCols = headerRow.length - 1;
    if (numCols <= 0) return { slotKeys: [], people: [] };
    const slotsPerDay = Math.floor(numCols / 7) || 1;
    const times = [];
    for (let i = 0; i < slotsPerDay; i++) {
      const parts = parseTimeHeaderParts(headerRow[1 + i]);
      if (parts) times.push({ hour: parts.hour, minute: parts.minute });
      else times.push({ hour: 9 + Math.floor(i / 2), minute: (i % 2) * 30 });
    }
    const slotKeys = [];
    for (let c = 1; c < headerRow.length; c++) {
      const colIdx = c - 1;
      const dayIndex = Math.floor(colIdx / slotsPerDay);
      const t = times[colIdx % slotsPerDay];
      slotKeys.push(toSlotKey(weekStart, dayIndex, t.hour, t.minute));
    }
    const people = [];
    for (let r = 1; r < rows.length; r++) {
      const rawName = trimQuotes(rows[r][0]).trim();
      if (!rawName) continue;
      const displayName = toDisplayName(rawName, nicknameMap);
      const slots = [];
      for (let c = 1; c < rows[r].length && c - 1 < slotKeys.length; c++) {
        const val = (rows[r][c] || '').toString().trim().toLowerCase();
        if (val === 'yes' || val === '1' || val === 'true' || val === 'o') slots.push(slotKeys[c - 1]);
      }
      people.push({ rawName, displayName, slots });
    }
    return { slotKeys, people };
  }

  const headerRow = rows[0];
  const names = [];
  for (let c = 1; c < headerRow.length; c++) {
    names.push(trimQuotes(headerRow[c]).trim());
  }
  const slotKeys = [];
  const peopleSlots = names.map(() => []);
  for (let r = 1; r < rows.length; r++) {
    const timeStr = (rows[r][0] || '').toString().trim();
    const dateParts = parseDateTimeParts(timeStr);
    const key = dateParts
      ? toSlotKeyFromParts(dateParts)
      : (() => {
          const parts = parseTimeHeaderParts(timeStr);
          return parts ? toSlotKey(weekStart, parts.dayIndex, parts.hour, parts.minute) : null;
        })();
    if (key) slotKeys.push(key);
    for (let c = 1; c < rows[r].length && c - 1 < names.length; c++) {
      const val = (rows[r][c] || '').toString().trim().toLowerCase();
      const available = val === '1' || val === 'yes' || val === 'true' || val === 'o';
      if (available && key) peopleSlots[c - 1].push(key);
    }
  }
  const people = names.map((rawName, i) => ({
    rawName,
    displayName: toDisplayName(rawName, nicknameMap),
    slots: peopleSlots[i] || [],
  }));
  return { slotKeys, people };
}

export function mergeParsedResults(results) {
  const slotKeySet = new Set();
  const peopleByDisplay = new Map();
  for (const { slotKeys, people } of results) {
    slotKeys.forEach((k) => slotKeySet.add(k));
    people.forEach((p) => {
      const existing = peopleByDisplay.get(p.displayName);
      const slotSet = new Set(existing ? existing.slots : []);
      p.slots.forEach((s) => slotSet.add(s));
      peopleByDisplay.set(p.displayName, { displayName: p.displayName, rawName: p.rawName, slots: [...slotSet] });
    });
  }
  const slotKeys = [...slotKeySet].sort();
  const people = [...peopleByDisplay.values()];
  return { slotKeys, people };
}

export { DEFAULT_NICKNAME_MAP, toDisplayName };
