import LZString from 'lz-string'

const HASH_PREFIX = 'd='

/**
 * 일정 데이터를 URL 해시에 넣기 위한 문자열로 압축 인코딩
 * @param {object} data - mergeParsedResults 형태 { slotKeys, people }
 * @returns {string} URL-safe 인코딩 문자열
 */
export function encodeShareData(data) {
  if (!data?.slotKeys?.length && !data?.people?.length) return ''
  try {
    const json = JSON.stringify(data)
    return LZString.compressToEncodedURIComponent(json)
  } catch {
    return ''
  }
}

/**
 * 해시에서 추출한 문자열을 일정 데이터로 복원
 * @param {string} encoded - encodeShareData 결과
 * @returns {object|null} { slotKeys, people } 또는 null
 */
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

/**
 * 현재 URL 해시에서 공유 데이터 파라미터 추출
 * @returns {string|null} 'd=...' 뒤의 값 또는 null
 */
export function getShareDataFromHash() {
  const hash = window.location.hash?.slice(1) || ''
  if (!hash.startsWith(HASH_PREFIX)) return null
  return hash.slice(HASH_PREFIX.length) || null
}

/**
 * 공유 URL 생성 (현재 origin + pathname + #d=encoded)
 */
export function buildShareUrl(data) {
  const encoded = encodeShareData(data)
  if (!encoded) return ''
  const base = window.location.origin + window.location.pathname.replace(/\/$/, '') || ''
  return `${base}#${HASH_PREFIX}${encoded}`
}
