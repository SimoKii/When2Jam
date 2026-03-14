import { useState, useCallback, useEffect } from 'react'
import Grid from './components/Grid'
import { parseCsvText, mergeParsedResults } from './lib/parseWhen2MeetCsv'
import { getShareDataFromHash, decodeShareData } from './lib/shareLink'
import { parseRoomScheduleCsv } from './lib/parseRoomSchedule'

const CSV_URLS = ['/when2meet1.csv', '/when2meet2.csv', '/when2meet3.csv', '/when2meet4.csv']
const STORAGE_KEY = 'band-schedule-data'
const SETTINGS_KEY = 'band-schedule-settings'

const defaultSettings = {
  minPeople: 5,
  totalPeople: 7,
  requiredMember: '준희',
}

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const settingsRaw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      const settings = settingsRaw ? { ...defaultSettings, ...JSON.parse(settingsRaw) } : defaultSettings
      return { data, settings }
    }
  } catch (_) {}
  return { data: null, settings: defaultSettings }
}

function saveStored(data, settings) {
  try {
    if (data) localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    if (settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (_) {}
}

export default function App() {
  const [view, setView] = useState('loading')
  const [mergedData, setMergedData] = useState(null)
  const [settings, setSettings] = useState(defaultSettings)
  const [roomSchedule, setRoomSchedule] = useState([])

  useEffect(() => {
    const encoded = getShareDataFromHash()
    if (encoded) {
      const data = decodeShareData(encoded)
      if (data) {
        setMergedData(data)
        setView('grid')
        return
      }
    }
    Promise.all(CSV_URLS.map((url) => fetch(url).then((r) => (r.ok ? r.text() : null))))
      .then((texts) => {
        const results = texts
          .filter(Boolean)
          .map((text) => parseCsvText(text, undefined, {}))
          .filter((p) => p.slotKeys.length > 0 || p.people.length > 0)
        if (results.length === 0) return null
        return mergeParsedResults(results)
      })
      .then((data) => {
        if (data && (data.slotKeys?.length > 0 || data.people?.length > 0)) {
          setMergedData(data)
          setSettings((prev) => ({ ...prev, ...loadStored().settings }))
          setView('grid')
        } else {
          setView('error')
        }
      })
      .catch(() => setView('error'))
  }, [])

  useEffect(() => {
    fetch('/room-schedule-march.csv')
      .then((r) => (r.ok ? r.text() : ''))
      .then((text) => {
        if (text) setRoomSchedule(parseRoomScheduleCsv(text, 2026))
      })
      .catch(() => {})
  }, [])

  const updateSettings = useCallback((next) => {
    setSettings((prev) => {
      const s = { ...prev, ...next }
      saveStored(mergedData, s)
      return s
    })
  }, [mergedData])

  if (view === 'grid' && mergedData) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] p-3 sm:p-4 md:p-6">
        <header className="mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">밴드 합주 일정</h1>
        </header>
        <Grid
          data={mergedData}
          settings={settings}
          onSettingsChange={updateSettings}
          roomSchedule={roomSchedule}
        />
      </div>
    )
  }

  if (view === 'error') {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] p-4 flex items-center justify-center">
        <p className="text-[var(--color-text-muted)]">
          일정 CSV를 불러올 수 없습니다. <code className="bg-[var(--color-primary-light)] text-[var(--color-primary)] px-2 py-0.5 rounded-lg">public/</code>에 when2meet1.csv ~ 4.csv를 넣어 주세요.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-4 flex items-center justify-center">
      <p className="text-[var(--color-primary)] font-medium">일정을 불러오는 중…</p>
    </div>
  )
}

