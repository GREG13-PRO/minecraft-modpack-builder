import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Globe, Gamepad2, KeyRound, FolderOpen } from 'lucide-react'
import type { LauncherType } from '@shared/types'
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

  const { data: launcherStatus } = useQuery({
    queryKey: ['launcherStatus'],
    queryFn: () => window.api.launcher.getStatus()
  })

  useEffect(() => {
    window.api.settings.hasCurseForgeApiKey().then(setHasKey)
  }, [])

  async function handleLauncherTypeChange(type: LauncherType): Promise<void> {
    await window.api.launcher.setType(type)
    queryClient.invalidateQueries({ queryKey: ['launcherStatus'] })
  }

  async function handleBrowseLauncher(): Promise<void> {
    const picked = await window.api.launcher.pickExecutable()
    if (picked) queryClient.invalidateQueries({ queryKey: ['launcherStatus'] })
  }

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
        <h3 className="settings-card-title">
          <Globe size={16} /> {t('settings.language')}
        </h3>
        <select className="input" value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </section>

      <section className="settings-card">
        <h3 className="settings-card-title">
          <Gamepad2 size={16} /> {t('settings.launcher.title')}
        </h3>
        <p className="settings-field-label">{t('settings.launcher.which')}</p>
        <div className="launcher-grid">
          <button
            className={launcherStatus?.type === 'official' ? 'launcher-option active' : 'launcher-option'}
            onClick={() => handleLauncherTypeChange('official')}
          >
            {t('settings.launcher.official')}
          </button>
          <button
            className={launcherStatus?.type === 'tlauncher' ? 'launcher-option active' : 'launcher-option'}
            onClick={() => handleLauncherTypeChange('tlauncher')}
          >
            {t('settings.launcher.tlauncher')}
          </button>
        </div>

        {launcherStatus?.path ? (
          <div className="key-status ok">{t('settings.launcher.customPath', { path: launcherStatus.path })}</div>
        ) : launcherStatus?.detectedPath ? (
          <div className="key-status ok">{t('settings.launcher.detected', { path: launcherStatus.detectedPath })}</div>
        ) : (
          <div className="key-status missing">{t('settings.launcher.notDetected')}</div>
        )}

        <div className="key-form">
          <button className="btn btn-ghost" onClick={handleBrowseLauncher}>
            <FolderOpen size={15} /> {t('settings.launcher.browse')}
          </button>
        </div>

        <p className="hint">{t('settings.launcher.note')}</p>
      </section>

      <section className="settings-card">
        <h3 className="settings-card-title">
          <KeyRound size={16} /> {t('settings.curseforgeApiKey')}
        </h3>
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
