import yauzl from 'yauzl'

const METADATA_ENTRIES = [
  'fabric.mod.json',
  'META-INF/mods.toml',
  'META-INF/neoforge.mods.toml',
  'mcmod.info',
  'META-INF/MANIFEST.MF'
] as const

export type MetadataEntryName = (typeof METADATA_ENTRIES)[number]

export type JarMetadataEntries = Partial<Record<MetadataEntryName, string>>

// Reads whichever of the known mod-metadata files exist inside a jar,
// without extracting anything to disk.
export function readJarMetadata(jarPath: string): Promise<JarMetadataEntries> {
  return new Promise((resolve, reject) => {
    const result: JarMetadataEntries = {}

    yauzl.open(jarPath, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) return reject(err ?? new Error('Failed to open jar'))

      zipfile.on('error', reject)
      zipfile.readEntry()

      zipfile.on('entry', (entry) => {
        const name = entry.fileName as MetadataEntryName
        if (!METADATA_ENTRIES.includes(name)) {
          zipfile.readEntry()
          return
        }

        zipfile.openReadStream(entry, (streamErr, stream) => {
          if (streamErr || !stream) {
            zipfile.readEntry()
            return
          }
          const chunks: Buffer[] = []
          stream.on('data', (chunk) => chunks.push(chunk))
          stream.on('end', () => {
            result[name] = Buffer.concat(chunks).toString('utf-8')
            zipfile.readEntry()
          })
          stream.on('error', () => zipfile.readEntry())
        })
      })

      zipfile.on('end', () => resolve(result))
    })
  })
}
