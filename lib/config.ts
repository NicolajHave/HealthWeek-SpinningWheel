/** Event-specific copy, filled in from the environment before deploy. */
export const eventConfig = {
  powerUpLocation: process.env.POWER_UP_LOCATION || '[LOCATION]',
  powerUpPrize: process.env.POWER_UP_PRIZE || 'smoothies',
  photoPrize: process.env.PHOTO_PRIZE || 'smoothie',
  kioskLocation: process.env.KIOSK_LOCATION || '[LOCATION]',
} as const

export type EventConfig = typeof eventConfig
