import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '../../i18n'
import './Settings.css'

type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'valid' }
  | { kind: 'invalid'; message: string }
  | { kind: 'error'; message: string }

function Settings(): React.JSX.Element {
  const { t, i18n } = useTranslation()
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
        setSaveState({ kind: 'invalid', message: t('settings.keyInvalid', { status: result.status }) })
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
      <h2 className="settings-title">{t('settings.title')}</h2>

      <section className="settings-card">
        <h3 className="settings-card-title">{t('settings.language')}</h3>
        <select className="input" value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </section>

      <section className="settings-card">
        <h3 className="settings-card-title">{t('settings.curseforgeApiKey')}</h3>
        <p className="hint">
          {t('settings.hintPrefix')}{' '}
          <a href="https://console.curseforge.com/" target="_blank" rel="noreferrer">
            console.curseforge.com
          </a>
          {t('settings.hintSuffix')}
        </p>

        {hasKey === true && <div className="key-status ok">{t('settings.keyStatusOk')}</div>}
        {hasKey === false && <div className="key-status missing">{t('settings.keyStatusMissing')}</div>}

        <div className="key-form">
          <input
            className="input"
            type="password"
            placeholder={t('settings.placeholder')}
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
          />
          <button className="btn" onClick={handleSave} disabled={!keyInput.trim() || saveState.kind === 'saving'}>
            {saveState.kind === 'saving' ? t('settings.checking') : t('settings.save')}
          </button>
          {hasKey === true && (
            <button className="btn btn-danger" onClick={handleClear}>
              {t('settings.clear')}
            </button>
          )}
        </div>

        {saveState.kind === 'valid' && <p className="status ok">{t('settings.keyValid')}</p>}
        {saveState.kind === 'invalid' && <p className="status error">{saveState.message}</p>}
        {saveState.kind === 'error' && <p className="status error">{t('settings.keyError', { message: saveState.message })}</p>}
      </section>
    </div>
  )
}

export default Settings
