import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, RefreshCw, X } from 'lucide-react'
import { useUpdaterStore } from '../state/updaterStore'
import './UpdateBanner.css'

function UpdateBanner(): React.JSX.Element | null {
  const { t } = useTranslation()
  const status = useUpdaterStore((s) => s.status)
  const [dismissed, setDismissed] = useState<string | null>(null)

  if (
    status.state !== 'available' &&
    status.state !== 'downloading' &&
    status.state !== 'downloaded'
  )
    return null
  if (dismissed === status.state) return null

  return (
    <div className="update-banner">
      {status.state === 'available' && (
        <>
          <span className="update-banner-text">
            {t('updater.updateAvailable', { version: status.version })}
          </span>
          <button className="btn" onClick={() => window.api.updater.download()}>
            <Download size={14} /> {t('updater.download')}
          </button>
        </>
      )}

      {status.state === 'downloading' && (
        <span className="update-banner-text">
          {t('updater.downloading', { percent: status.percent })}
        </span>
      )}

      {status.state === 'downloaded' && (
        <>
          <span className="update-banner-text">
            {t('updater.downloaded', { version: status.version })}
          </span>
          <button className="btn" onClick={() => window.api.updater.install()}>
            <RefreshCw size={14} /> {t('updater.restartInstall')}
          </button>
        </>
      )}

      <button
        className="update-banner-dismiss"
        onClick={() => setDismissed(status.state)}
        aria-label={t('updater.dismiss')}
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default UpdateBanner
