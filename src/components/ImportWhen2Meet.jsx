import { useState } from 'react'
import { parseCsvText, mergeParsedResults } from '../lib/parseWhen2MeetCsv'

function getWeekStart(date) {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateString(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function ImportWhen2Meet({ onImport }) {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const defaultFirstSunday = toDateString(getWeekStart(new Date()))
  const [firstWeekSunday, setFirstWeekSunday] = useState(defaultFirstSunday)

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setError(null)
    setLoading(true)
    try {
      const baseWeek = firstWeekSunday ? getWeekStart(new Date(firstWeekSunday + 'T00:00:00')) : getWeekStart(new Date())
      const results = []
      for (let i = 0; i < files.length; i++) {
        const text = await files[i].text()
        const weekStart = new Date(baseWeek)
        weekStart.setDate(weekStart.getDate() + i * 7)
        const parsed = parseCsvText(text, undefined, { weekStart })
        if (parsed.slotKeys.length || parsed.people.length) results.push(parsed)
      }
      if (!results.length) {
        setError('유효한 데이터가 없습니다. CSV 형식을 확인해 주세요.')
        setLoading(false)
        return
      }
      const merged = mergeParsedResults(results)
      onImport(merged)
    } catch (err) {
      setError(err.message || 'CSV 파싱 중 오류가 났습니다.')
    }
    setLoading(false)
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-lg font-medium text-slate-800">when2meet에서 가져오기</h2>
      <p className="mb-4 text-sm text-slate-600">
        when2meet 페이지에서 CSV를 추출한 뒤 아래에서 업로드하세요. 여러 주(파일)를 한 번에 선택하면 자동으로 합쳐집니다.
      </p>
      <label className="mb-4 block text-sm text-slate-700">
        <span className="mb-1 block">첫 번째 CSV가 해당하는 주의 일요일 (예: when2meet1 → 3/15)</span>
        <input
          type="date"
          value={firstWeekSunday}
          onChange={(e) => setFirstWeekSunday(e.target.value || defaultFirstSunday)}
          className="rounded border border-slate-300 px-2 py-1"
        />
      </label>
      <label className="block">
        <span className="mb-2 inline-block rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white cursor-pointer hover:bg-slate-700">
          CSV 파일 선택 (여러 개 가능)
        </span>
        <input
          type="file"
          accept=".csv,text/csv,text/plain"
          multiple
          onChange={handleFiles}
          className="hidden"
        />
      </label>
      <p className="mt-3 text-xs text-slate-500">
        추출 방법:{' '}
        <a
          href="https://aculich.github.io/when2meet-extractor/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          when2meet-extractor 북마클릿
        </a>
        ,{' '}
        <a
          href="https://gist.github.com/camtheman256/3125e18ba20e90b6252678714e5102fd"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          브라우저 콘솔 스크립트
        </a>
      </p>
      {loading && <p className="mt-3 text-sm text-slate-500">불러오는 중…</p>}
      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
