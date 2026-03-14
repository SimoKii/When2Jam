import LZString from 'lz-string'

const HASH_PREFIX = 'd='

// 일정 데이터 → URL 해시 인코딩
export function encodeShareData(data) {
  if (!data?.slotKeys?.length && !data?.people?.length) return ''
  try {
    const json = JSON.stringify(data)
    return LZString.compressToEncodedURIComponent(json)
  } catch {
    return ''
  }
}

export function decodeShareData(encoded) {
  if (!encoded || typeof encoded !== 'string') return null
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    const data = JSON.parse(json)
    if (!Array.isArray(data.slotKeys) || !Array.isArray(data.people)) return null
    return data
  } catch {
    return null
  }
}

export function getShareDataFromHash() {
  const hash = window.location.hash?.slice(1) || ''
  if (!hash.startsWith(HASH_PREFIX)) return null
  return hash.slice(HASH_PREFIX.length) || null
}

export function buildShareUrl(data) {
  const encoded = encodeShareData(data)
  if (!encoded) return ''
  const base = window.location.origin + window.location.pathname.replace(/\/$/, '') || ''
  return `${base}#${HASH_PREFIX}${encoded}`
}
