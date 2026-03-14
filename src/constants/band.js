/**
 * 밴드 멤버 역할 정의 (표시 이름 기준)
 * 역할별 이모지와 displayName → role 역매핑용
 */

export const ROLES_BY_MEMBER = {
  vocal: ['희은', '다훈'],
  guitar1: ['재영'],
  guitar2: ['기호'],
  bass: ['솔희'],
  piano: ['준성'],
  drums: ['준희'],
}

export const ROLE_EMOJI = {
  vocal: '🎤',
  guitar1: '🎸',
  guitar2: '🎸',
  bass: '🪕',
  piano: '🎹',
  drums: '🥁',
}

const displayNameToRole = (() => {
  const map = new Map()
  for (const [role, names] of Object.entries(ROLES_BY_MEMBER)) {
    for (const name of names) {
      map.set(name, role)
    }
  }
  return map
})()

/**
 * @param {string} displayName
 * @returns {string|null} role key (vocal, guitar1, ...) or null if not in band
 */
export function getRoleByDisplayName(displayName) {
  return displayNameToRole.get(displayName) ?? null
}

/** 역할 표시 순서 */
export const ROLE_ORDER = ['vocal', 'guitar1', 'guitar2', 'bass', 'piano', 'drums']
