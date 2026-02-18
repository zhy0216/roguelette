import { rng } from './rng'

export type DealerType = 'degen' | 'coward' | 'maniac' | 'mimic' | 'paranoid'
export type DealerAction = 'shoot_opponent' | 'shoot_self'

export interface DealerInfo {
  type: DealerType
  name: string
  description: string
}

export const DEALERS: Record<DealerType, DealerInfo> = {
  degen: { type: 'degen', name: '赌狗', description: 'P(实弹)>40%就射你' },
  coward: { type: 'coward', name: '懦夫', description: '100%确定才射你' },
  maniac: { type: 'maniac', name: '疯子', description: '完全随机' },
  mimic: { type: 'mimic', name: '模仿者', description: '复制你的行动' },
  paranoid: { type: 'paranoid', name: '偏执狂', description: '永远射你' },
}

export function getDealerAction(
  type: DealerType,
  liveCount: number,
  blankCount: number,
  playerLastAction: DealerAction | null,
): DealerAction {
  const total = liveCount + blankCount
  const pLive = total > 0 ? liveCount / total : 0

  switch (type) {
    case 'degen':
      return pLive > 0.4 ? 'shoot_opponent' : 'shoot_self'
    case 'coward':
      return blankCount === 0 ? 'shoot_opponent' : 'shoot_self'
    case 'maniac':
      return rng() < 0.5 ? 'shoot_opponent' : 'shoot_self'
    case 'mimic':
      return playerLastAction ?? 'shoot_opponent'
    case 'paranoid':
      return 'shoot_opponent'
  }
}
