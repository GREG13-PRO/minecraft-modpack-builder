import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import './Settings.css'

type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'valid' }
  | { kind: 'invalid'; message: string }
  | { kind: 'error'; message: string }

function Settings(): React.JSX.Element {
  const queryClient = useQueryClient()
  const [hasKey, setHasKey] = useState<boolean | null>(null)
  const [keyInput, setKeyInput] = useState('')
  const [saveState, setSaveState] = useState<SaveState>({ kind: 'idle' })

  useEffect(() => {
    window.api.settings.hasCurseForgeApiKey().then(setHasKey)
  }, [])

  async function handleSave(): Promise<void> {
    const key = keyInput.trim()
    if (!key) return

    setSaveState({ kind: 'saving' })
    try {
      await window.api.settings.setCurseForgeApiKey(key)
      setHasKey(true)
      setKeyInput('')
      queryClient.invalidateQueries({ queryKey: ['hasCurseForgeApiKey'] })
      queryClient.invalidateQueries({ queryKey: ['modSearch'] })

      const result = await window.api.settings.testCurseForgeApiKey(key)
      if (result.ok) {
        setSaveState({ kind: 'valid' })
      } else {
        setSaveState({
          kind: 'invalid',
          message: `A CurseForge elutasította a kulcsot (${result.status}). Ellenőrizd, hogy Core API kulcsot adtál-e meg, ne "Studio" personal access tokent.`
        })
      }
    } catch (err) {
      setSaveState({ kind: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }

  async function handleClear(): Promise<void> {
    try {
      await window.api.settings.clearCurseForgeApiKey()
      setHasKey(false)
      setSaveState({ kind: 'idle' })
      queryClient.invalidateQueries({ queryKey: ['hasCurseForgeApiKey'] })
      queryClient.invalidateQueries({ queryKey: ['modSearch'] })
    } catch (err) {
      setSaveState({ kind: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }

  return (
    <div className="settings">
      <h2>Beállítások</h2>

      <section>
        <h3>CurseForge API kulcs</h3>
        <p className="hint">
          A Core API kulcsot a{' '}
          <a href="https://console.curseforge.com/" target="_blank" rel="noreferrer">
            console.curseforge.com
          </a>{' '}
          oldalon igényelheted. A kulcs titkosítva kerül tárolásra ezen a gépen, soha nem kerül a projekt
          fájljaiba.
        </p>

        {hasKey === true && <p className="key-status ok">✓ API kulcs be van állítva</p>}
        {hasKey === false && (
          <p className="key-status missing">Nincs beállítva API kulcs — a CurseForge keresés nem fog működni</p>
        )}

        <div className="key-form">
          <input
            type="password"
            placeholder="Illeszd be a CurseForge API kulcsot"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
          />
          <button onClick={handleSave} disabled={!keyInput.trim() || saveState.kind === 'saving'}>
            {saveState.kind === 'saving' ? 'Mentés és ellenőrzés...' : 'Mentés'}
          </button>
          {hasKey === true && (
            <button className="danger" onClick={handleClear}>
              Törlés
            </button>
          )}
        </div>

        {saveState.kind === 'valid' && (
          <p className="status ok">✓ Elmentve és ellenőrizve — a kulcs érvényes és működik.</p>
        )}
        {saveState.kind === 'invalid' && <p className="status error">⚠ Elmentve, de: {saveState.message}</p>}
        {saveState.kind === 'error' && <p className="status error">Hiba történt: {saveState.message}</p>}
      </section>
    </div>
  )
}

export default Settings
