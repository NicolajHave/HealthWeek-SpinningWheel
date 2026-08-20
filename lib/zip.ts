import 'server-only'

/**
 * A minimal ZIP writer, stored (uncompressed) entries only.
 *
 * JPEGs are already compressed, so deflating them buys nothing and would only
 * add a dependency. Writing the archive by hand also lets it stream: each photo
 * is fetched, framed and pushed, then dropped — so the whole set never sits in
 * memory at once and the response is not bounded by a buffered body limit.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[i] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

/** MS-DOS date and time, as the ZIP header stores them. */
function dosStamp(date: Date): { time: number; date: number } {
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (Math.floor(date.getSeconds() / 2) & 0x1f),
    date: (((date.getFullYear() - 1980) & 0x7f) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  }
}

interface Written {
  name: Uint8Array
  crc: number
  size: number
  offset: number
  time: number
  date: number
}

export interface ZipEntry {
  /** Name inside the archive, including any extension. */
  name: string
  /** Resolves to the file's bytes. Called one at a time, in order. */
  read: () => Promise<Uint8Array | null>
  modified?: Date
}

const LOCAL_HEADER = 0x04034b50
const CENTRAL_HEADER = 0x02014b50
const END_OF_CENTRAL = 0x06054b50
/** Bit 11: the filename is UTF-8. */
const FLAG_UTF8 = 0x0800

/**
 * Streams a ZIP of `entries`. An entry whose `read` returns null or throws is
 * skipped — one unreadable photo must not cost the organiser the other thirteen.
 */
export function zipStream(entries: ZipEntry[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const written: Written[] = []
  let offset = 0
  let index = 0

  const push = (controller: ReadableStreamDefaultController<Uint8Array>, bytes: Uint8Array) => {
    controller.enqueue(bytes)
    offset += bytes.length
  }

  return new ReadableStream<Uint8Array>({
    // Every pull must enqueue or close. Returning without doing either leaves
    // the pending read unanswered and the download hangs, so a skipped entry
    // moves straight on to the next one rather than returning.
    async pull(controller) {
      while (index < entries.length) {
        const entry = entries[index++]

        let body: Uint8Array | null = null
        try {
          body = await entry.read()
        } catch {
          body = null
        }
        if (!body) continue

        const name = encoder.encode(entry.name)
        const { time, date } = dosStamp(entry.modified ?? new Date(0))
        const crc = crc32(body)

        const header = new DataView(new ArrayBuffer(30))
        header.setUint32(0, LOCAL_HEADER, true)
        header.setUint16(4, 20, true) // version needed
        header.setUint16(6, FLAG_UTF8, true)
        header.setUint16(8, 0, true) // stored
        header.setUint16(10, time, true)
        header.setUint16(12, date, true)
        header.setUint32(14, crc, true)
        header.setUint32(18, body.length, true)
        header.setUint32(22, body.length, true)
        header.setUint16(26, name.length, true)
        header.setUint16(28, 0, true) // no extra field

        written.push({ name, crc, size: body.length, offset, time, date })
        push(controller, new Uint8Array(header.buffer))
        push(controller, name)
        push(controller, body)
        return
      }

      // Every entry is framed; write the central directory and close.
      const start = offset
      for (const file of written) {
        const record = new DataView(new ArrayBuffer(46))
        record.setUint32(0, CENTRAL_HEADER, true)
        record.setUint16(4, 20, true) // version made by
        record.setUint16(6, 20, true) // version needed
        record.setUint16(8, FLAG_UTF8, true)
        record.setUint16(10, 0, true) // stored
        record.setUint16(12, file.time, true)
        record.setUint16(14, file.date, true)
        record.setUint32(16, file.crc, true)
        record.setUint32(20, file.size, true)
        record.setUint32(24, file.size, true)
        record.setUint16(28, file.name.length, true)
        record.setUint16(30, 0, true) // extra
        record.setUint16(32, 0, true) // comment
        record.setUint16(34, 0, true) // disk number
        record.setUint16(36, 0, true) // internal attributes
        record.setUint32(38, 0, true) // external attributes
        record.setUint32(42, file.offset, true)
        push(controller, new Uint8Array(record.buffer))
        push(controller, file.name)
      }

      const end = new DataView(new ArrayBuffer(22))
      end.setUint32(0, END_OF_CENTRAL, true)
      end.setUint16(4, 0, true) // this disk
      end.setUint16(6, 0, true) // disk with central directory
      end.setUint16(8, written.length, true)
      end.setUint16(10, written.length, true)
      end.setUint32(12, offset - start, true)
      end.setUint32(16, start, true)
      end.setUint16(20, 0, true) // no comment
      push(controller, new Uint8Array(end.buffer))

      controller.close()
    },
  })
}

/** Filesystem-safe, lowercase, no spaces — these land in someone's Downloads folder. */
export function slugify(value: string): string {
  return (
    value
      // Nordic letters do not decompose, so map them before stripping accents.
      .replace(/[\u00E6]/g, 'ae')
      .replace(/[\u00C6]/g, 'AE')
      .replace(/[\u00F8]/g, 'oe')
      .replace(/[\u00D8]/g, 'OE')
      .replace(/[\u00E5]/g, 'aa')
      .replace(/[\u00C5]/g, 'AA')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'team'
  )
}
