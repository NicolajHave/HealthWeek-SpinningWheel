/** Event-specific copy, filled in from the environment before deploy. */
export const eventConfig = {
  powerUpLocation: process.env.POWER_UP_LOCATION || '[LOCATION]',
  // Both read as the subject of a sentence, so they carry a phrase rather than
  // a bare noun: "<prize> is waiting for your team at <location>."
  powerUpPrize: process.env.POWER_UP_PRIZE || 'Something delicious from the restaurant',
  photoPrize: process.env.PHOTO_PRIZE || 'something delicious from the restaurant',
  kioskLocation: process.env.KIOSK_LOCATION || '[LOCATION]',
} as const

export type EventConfig = typeof eventConfig
