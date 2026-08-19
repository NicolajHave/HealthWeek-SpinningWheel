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
