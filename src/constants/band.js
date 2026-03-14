// 밴드 역할·이모지·표시이름 매핑

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

export function getRoleByDisplayName(displayName) {
  return displayNameToRole.get(displayName) ?? null
}

export const ROLE_ORDER = ['vocal', 'guitar1', 'guitar2', 'bass', 'piano', 'drums']
