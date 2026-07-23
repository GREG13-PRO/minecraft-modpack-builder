import { useEffect, useState } from 'react'
import './Settings.css'

function Settings(): React.JSX.Element {
  const [hasKey, setHasKey] = useState<boolean | null>(null)
  const [keyInput, setKeyInput] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    window.api.settings.hasCurseForgeApiKey().then(setHasKey)
  }, [])

  async function handleSave(): Promise<void> {
    if (!keyInput.trim()) return
    await window.api.settings.setCurseForgeApiKey(keyInput.trim())
    setKeyInput('')
    setHasKey(true)
    setStatus('API kulcs elmentve (titkosítva).')
  }

  async function handleClear(): Promise<void> {
    await window.api.settings.clearCurseForgeApiKey()
    setHasKey(false)
    setStatus('API kulcs törölve.')
  }

  return (
    <div className="settings">
      <h2>Beállítások</h2>

      <section>
        <h3>CurseForge API kulcs</h3>
        <p className="hint">
          Ingyenesen igényelhető a{' '}
          <a href="https://console.curseforge.com/" target="_blank" rel="noreferrer">
            console.curseforge.com
          </a>{' '}
          oldalon. A kulcs titkosítva kerül tárolásra ezen a gépen, soha nem kerül a projekt fájljaiba.
        </p>

        {hasKey === true && <p className="key-status ok">✓ API kulcs be van állítva</p>}
        {hasKey === false && <p className="key-status missing">Nincs beállítva API kulcs — a CurseForge keresés nem fog működni</p>}

        <div className="key-form">
          <input
            type="password"
            placeholder="Illeszd be a CurseForge API kulcsot"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
          />
          <button onClick={handleSave} disabled={!keyInput.trim()}>
            Mentés
          </button>
          {hasKey === true && (
            <button className="danger" onClick={handleClear}>
              Törlés
            </button>
          )}
        </div>

        {status && <p className="status">{status}</p>}
      </section>
    </div>
  )
}

export default Settings
