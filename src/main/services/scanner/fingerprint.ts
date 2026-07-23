import { createHash } from 'crypto'

export function sha1Hex(data: Buffer): string {
  return createHash('sha1').update(data).digest('hex')
}

// CurseForge's file-matching hash: a 32-bit Murmur2 (seed 1) over the file
// bytes with whitespace (tab/LF/CR/space) stripped first. This is what the
// official CurseForge client uses to identify installed jars, and is the
// only reliable way to match a local file to a CurseForge mod/file id.
export function curseForgeFingerprint(data: Buffer): number {
  const filtered = Buffer.from([...data].filter((b) => b !== 9 && b !== 10 && b !== 13 && b !== 32))
  return murmur2(filtered, 1)
}

function murmur2(data: Buffer, seed: number): number {
  const m = 0x5bd1e995
  const r = 24
  let len = data.length
  let h = (seed ^ len) >>> 0
  let i = 0

  while (len >= 4) {
    let k =
      (data[i] & 0xff) | ((data[i + 1] & 0xff) << 8) | ((data[i + 2] & 0xff) << 16) | ((data[i + 3] & 0xff) << 24)

    k = Math.imul(k, m) >>> 0
    k ^= k >>> r
    k = Math.imul(k, m) >>> 0

    h = Math.imul(h, m) >>> 0
    h ^= k

    i += 4
    len -= 4
  }

  switch (len) {
    case 3:
      h ^= (data[i + 2] & 0xff) << 16
    // eslint-disable-next-line no-fallthrough
    case 2:
      h ^= (data[i + 1] & 0xff) << 8
    // eslint-disable-next-line no-fallthrough
    case 1:
      h ^= data[i] & 0xff
      h = Math.imul(h, m) >>> 0
  }

  h ^= h >>> 13
  h = Math.imul(h, m) >>> 0
  h ^= h >>> 15

  return h >>> 0
}
