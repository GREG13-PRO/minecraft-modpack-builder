import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { X, Package, Check } from 'lucide-react'
import type { ContentType, ModLoader, ModRef, ModVersionRef } from '@shared/types'
import './ModDetail.css'

interface ModDetailProps {
  modRef: ModRef
  mcVersion: string
  loader: ModLoader
  contentType: ContentType
  currentVersionId?: string
  onSelectVersion: (version: ModVersionRef) => void
  onClose: () => void
}

function ModDetail({
  modRef,
  mcVersion,
  loader,
  contentType,
  currentVersionId,
  onSelectVersion,
  onClose
}: ModDetailProps): React.JSX.Element {
  const { t } = useTranslation()

  const { data: versions, isFetching } = useQuery({
    queryKey: ['modVersions', modRef.source, modRef.projectId, mcVersion, loader, contentType],
    queryFn: () => window.api.search.listVersions(modRef, mcVersion, loader, contentType)
  })

  return (
    <div className="mod-detail-overlay" onClick={onClose}>
      <div className="mod-detail" onClick={(e) => e.stopPropagation()}>
        <button className="mod-detail-close" onClick={onClose} aria-label="close">
          <X size={16} />
        </button>

        <div className="mod-detail-head">
          <div className="mod-icon mod-detail-icon">
            {modRef.iconUrl ? <img src={modRef.iconUrl} alt="" /> : <Package size={22} />}
          </div>
          <div>
            <div className="mod-title">
              <span className="mod-name">{modRef.name}</span>
              <span className={`badge ${modRef.source}`}>{modRef.source}</span>
            </div>
            {modRef.summary && <p className="mod-summary">{modRef.summary}</p>}
          </div>
        </div>

        <h3 className="mod-detail-versions-title">{t('modDetail.versionsTitle')}</h3>

        {isFetching && <div className="mb-hint">{t('modDetail.loading')}</div>}
        {!isFetching && versions?.length === 0 && (
          <div className="mb-hint">{t('modDetail.noVersions')}</div>
        )}

        <div className="mod-detail-version-list">
          {versions?.map((version) => {
            const isCurrent = version.versionId === currentVersionId
            return (
              <div className="mod-detail-version" key={version.versionId}>
                <div className="mdv-info">
                  <span className="mdv-name">{version.displayName}</span>
                  <span className="mdv-meta">
                    {version.gameVersions.join(', ')} · {version.loaders.join(', ')}
                  </span>
                </div>
                <button
                  className={isCurrent ? 'btn btn-ghost' : 'btn'}
                  disabled={isCurrent}
                  onClick={() => onSelectVersion(version)}
                >
                  {isCurrent ? <Check size={14} /> : null}
                  {isCurrent ? t('modDetail.current') : t('modDetail.useVersion')}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ModDetail
