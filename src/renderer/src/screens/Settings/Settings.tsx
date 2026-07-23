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
      <h2 className="settings-title">Beállítások</h2>

      <section className="settings-card">
        <h3 className="settings-card-title">CurseForge API kulcs</h3>
        <p className="hint">
          A Core API kulcsot a{' '}
          <a href="https://console.curseforge.com/" target="_blank" rel="noreferrer">
            console.curseforge.com
          </a>{' '}
          oldalon igényelheted. A kulcs titkosítva kerül tárolásra ezen a gépen, soha nem kerül a projekt
          fájljaiba.
        </p>

        {hasKey === true && <div className="key-status ok">✓ API kulcs be van állítva</div>}
        {hasKey === false && (
          <div className="key-status missing">Nincs beállítva API kulcs — a CurseForge keresés nem fog működni</div>
        )}

        <div className="key-form">
          <input
            className="input"
            type="password"
            placeholder="Illeszd be a CurseForge API kulcsot"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
          />
          <button className="btn" onClick={handleSave} disabled={!keyInput.trim() || saveState.kind === 'saving'}>
            {saveState.kind === 'saving' ? 'Ellenőrzés...' : 'Mentés'}
          </button>
          {hasKey === true && (
            <button className="btn btn-danger" onClick={handleClear}>
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
