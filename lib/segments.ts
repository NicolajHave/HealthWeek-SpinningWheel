/**
 * The six wheel segments, in clockwise order starting from the top.
 *
 * The array index IS the wheel position: segment `i` is centered at
 * `i * 60 + 30` degrees clockwise from top. The server picks an index with
 * crypto.randomInt(0, 6) and stores the key; the client only ever receives an
 * index to animate toward.
 */

export type SegmentType = 'prize' | 'exercise'

export interface Segment {
  key: string
  /** Single-line label, used in result copy and on the board. */
  label: string
  /** Wheel label, pre-split into lines so it fits a 60 degree wedge. */
  wheelLines: [string, string]
  type: SegmentType
  /** Feeds the company-wide counter only. Wall sit counts seconds as reps. */
  reps: number
}

export const SEGMENTS: readonly Segment[] = [
  { key: 'power_up', label: 'The Power-Up', wheelLines: ['THE', 'POWER-UP'], type: 'prize', reps: 0 },
  { key: 'squats', label: '15 Air Squats', wheelLines: ['15 AIR', 'SQUATS'], type: 'exercise', reps: 15 },
  { key: 'jumping_jacks', label: '20 Jumping Jacks', wheelLines: ['20 JUMPING', 'JACKS'], type: 'exercise', reps: 20 },
  { key: 'wall_sit', label: '30 sec Wall Sit', wheelLines: ['30 SEC', 'WALL SIT'], type: 'exercise', reps: 30 },
  { key: 'lunges', label: '20 Walking Lunges', wheelLines: ['20 WALKING', 'LUNGES'], type: 'exercise', reps: 20 },
  { key: 'calf_raises', label: '20 Calf Raises', wheelLines: ['20 CALF', 'RAISES'], type: 'exercise', reps: 20 },
] as const

export const SEGMENT_COUNT = SEGMENTS.length

/** Same wording on all five exercise segments. */
export const SCALING_LINE = 'Take it at your own pace. Half reps count. Sit it out if you need to.'

/** Wheel positions of the five exercises — everything that is not the prize. */
export const EXERCISE_INDEXES: readonly number[] = SEGMENTS.reduce<number[]>(
  (acc, segment, index) => (segment.type === 'exercise' ? [...acc, index] : acc),
  [],
)

const PRIZE_INDEX = SEGMENTS.findIndex((segment) => segment.type === 'prize')

export interface PrizeOdds {
  /** Power-Ups already handed out today. */
  awarded: number
  /** Spins already taken today, not counting the one being decided. */
  spinsSoFar: number
  /** Teams on the list. */
  teamCount: number
  /** How many Power-Ups the day should hand out. Negative leaves the wheel untuned. */
  target: number
}

/**
 * Picks the wheel position for a spin.
 *
 * The prize is drawn the way you would deal winning tickets out of a hat:
 * the chance is `prizes left / teams left`, so it rises through the day as the
 * queue shortens and the exact target is reached by the last team. Every team
 * has the same overall chance — target / teamCount — and there is no cadence to
 * notice or position in the queue worth playing for.
 *
 * A negative target restores a flat one in six.
 *
 * Pure, so the odds can be tested without a database.
 */
export function chooseSegmentIndex(
  randomInt: (min: number, maxExclusive: number) => number,
  odds: PrizeOdds,
): number {
  const exercise = () => EXERCISE_INDEXES[randomInt(0, EXERCISE_INDEXES.length)]
  const { awarded, spinsSoFar, teamCount, target } = odds

  if (target < 0) return randomInt(0, SEGMENT_COUNT)

  const prizesLeft = target - awarded
  if (prizesLeft <= 0) return exercise()

  // This team is included in what is left to draw from.
  const teamsLeft = teamCount - spinsSoFar
  if (teamsLeft <= 0) return exercise()
  if (teamsLeft <= prizesLeft) return PRIZE_INDEX

  return randomInt(0, teamsLeft) < prizesLeft ? PRIZE_INDEX : exercise()
}

const BY_KEY = new Map(SEGMENTS.map((s, i) => [s.key, { ...s, index: i }]))

export function segmentByKey(key: string): (Segment & { index: number }) | undefined {
  return BY_KEY.get(key)
}

export function labelForKey(key: string): string {
  return BY_KEY.get(key)?.label ?? key
}

export function repsForKey(key: string): number {
  return BY_KEY.get(key)?.reps ?? 0
}
