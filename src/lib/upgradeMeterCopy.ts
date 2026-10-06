import { TIER_ADVANCE_THRESHOLD, type UpgradeProgress } from './exercise'

interface UpgradeMeterCopy {
  label: string
  spoken: string
}

export function upgradeMeterCopy(progress: UpgradeProgress): UpgradeMeterCopy {
  switch (progress.kind) {
    case 'run': {
      const { done, needed, total, target } = progress

      return {
        label: `${needed}${done === 0 ? '' : ' more'} today → ${target}`,
        spoken: `${done} of ${total} times through this verse today. ${needed} more, all within today, moves it up to ${target}.`,
      }
    }

    case 'moved':
      return progress.graduated
        ? {
            label: 'Graduated · now in review',
            spoken:
              'This verse graduated out of practice today. It comes back on a review schedule from here.',
          }
        : {
            label: `Moved up to ${progress.landed}`,
            spoken: `This verse moved up to ${progress.landed} today. It can move again tomorrow.`,
          }

    case 'rule':
      return {
        label: `${TIER_ADVANCE_THRESHOLD} times today moves it up`,
        spoken: `Going through this verse ${TIER_ADVANCE_THRESHOLD} times within one day moves it up a tier.`,
      }

    case 'scheduled':
      return {
        label: progress.label,
        spoken: `This verse is ${progress.label}.`,
      }
  }
}
