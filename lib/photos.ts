import { slugify } from './zip'

/** What a downloaded team photo is called on the organiser's machine. */
export function photoFilename(teamName: string): string {
  return `selected-health-week-${slugify(teamName)}.jpg`
}

export const PHOTO_ZIP_FILENAME = 'selected-health-week-photos.zip'
