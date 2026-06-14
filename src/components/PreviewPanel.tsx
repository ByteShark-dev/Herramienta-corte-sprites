import { useEffect, useRef } from 'react'
import { originPresetOptions } from '../types/models'
import type {
  ExportOptions,
  LoadedSpriteSheetImage,
  PreviewBackground,
  SpriteRegion,
} from '../types/models'
import { NumberField } from './NumberField'

interface PreviewPanelProps {
  image: LoadedSpriteSheetImage | null
  regions: SpriteRegion[]
  selectedRegion: SpriteRegion | null
  previewBackground: PreviewBackground
  exportOptions: ExportOptions
  onPreviewBackgroundChange: (value: PreviewBackground) => void
  onExportOptionChange: (field: keyof ExportOptions, value: number | string) => void
  onSelect: (index: number) => void
  onRegionChange: (field: 'x' | 'y' | 'width' | 'height', value: number) => void
  onOriginPresetChange: (preset: SpriteRegion['originPreset']) => void
  onOriginValueChange: (field: 'originX' | 'originY', value: number) => void
  onResetRegion: () => void
  onExportSelected: () => void
  onExportAll: () => void
  onExportZip: () => void
  onExportJson: () => void
}

const previewBackgroundClassName = (previewBackground: PreviewBackground) => {
  switch (previewBackground) {
    case 'black':
      return 'preview-surface preview-surface--black'
    case 'white':
      return 'preview-surface preview-surface--white'
    case 'checker':
    default:
      return 'preview-surface preview-surface--checker'
  }
}

export const PreviewPanel = ({
  image,
  regions,
  selectedRegion,
  previewBackground,
  exportOptions,
  onPreviewBackgroundChange,
  onExportOptionChange,
  onSelect,
  onRegionChange,
  onOriginPresetChange,
  onOriginValueChange,
  onResetRegion,
  onExportSelected,
  onExportAll,
  onExportZip,
  onExportJson,
}: PreviewPanelProps) => {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = previewCanvasRef.current
    const context = canvas?.getContext('2d')

    if (!canvas || !context) {
      return
    }

    context.clearRect(0, 0, canvas.width, canvas.height)

    if (
      !image ||
      !selectedRegion ||
      selectedRegion.width <= 0 ||
      selectedRegion.height <= 0
    ) {
      return
    }

    const scale = Math.min(canvas.width / selectedRegion.width, canvas.height / selectedRegion.height)
    const width = selectedRegion.width * scale
    const height = selectedRegion.height * scale
    const x = (canvas.width - width) / 2
    const y = (canvas.height - height) / 2

    context.imageSmoothingEnabled = false
    context.drawImage(
      image.element,
      selectedRegion.x,
      selectedRegion.y,
      selectedRegion.width,
      selectedRegion.height,
      x,
      y,
      width,
      height,
    )

    const originX = x + selectedRegion.originX * scale
    const originY = y + selectedRegion.originY * scale

    context.strokeStyle = '#ff9f43'
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(originX - 10, originY)
    context.lineTo(originX + 10, originY)
    context.moveTo(originX, originY - 10)
    context.lineTo(originX, originY + 10)
    context.stroke()
  }, [image, selectedRegion])

  const validCount = regions.filter((region) => region.isValid).length

  return (
    <aside className="app-panel app-panel--right">
      <div className="panel-section">
        <div className="panel-section__header">
          <h2>Selection</h2>
          <p>Preview, inspect, and manually tweak the active sprite.</p>
        </div>

        <div className={previewBackgroundClassName(previewBackground)}>
          <canvas ref={previewCanvasRef} width={220} height={220} />
        </div>

        <label className="field">
          <span className="field__label">Preview Background</span>
          <select
            className="field__input"
            value={previewBackground}
            onChange={(event) => onPreviewBackgroundChange(event.target.value as PreviewBackground)}
          >
            <option value="checker">Checkerboard</option>
            <option value="black">Black</option>
            <option value="white">White</option>
          </select>
        </label>

        {selectedRegion ? (
          <>
            <div className="summary-grid">
              <div className="metric">
                <span>Index</span>
                <strong>{selectedRegion.index}</strong>
              </div>
              <div className="metric">
                <span>Row / Col</span>
                <strong>
                  {selectedRegion.row} / {selectedRegion.column}
                </strong>
              </div>
              <div className="metric">
                <span>Status</span>
                <strong>{selectedRegion.isValid ? 'Valid' : 'Invalid'}</strong>
              </div>
              <div className="metric">
                <span>Manual</span>
                <strong>{selectedRegion.isManualOverride ? 'Yes' : 'No'}</strong>
              </div>
            </div>

            {selectedRegion.validationMessage ? (
              <div className="warning-list">
                <p>{selectedRegion.validationMessage}</p>
              </div>
            ) : null}

            <div className="field-grid">
              <NumberField
                label="X"
                value={selectedRegion.x}
                onChange={(value) => onRegionChange('x', value)}
                min={0}
              />
              <NumberField
                label="Y"
                value={selectedRegion.y}
                onChange={(value) => onRegionChange('y', value)}
                min={0}
              />
              <NumberField
                label="Width"
                value={selectedRegion.width}
                onChange={(value) => onRegionChange('width', value)}
                min={1}
              />
              <NumberField
                label="Height"
                value={selectedRegion.height}
                onChange={(value) => onRegionChange('height', value)}
                min={1}
              />
            </div>

            <label className="field">
              <span className="field__label">Origin Preset</span>
              <select
                className="field__input"
                value={selectedRegion.originPreset}
                onChange={(event) =>
                  onOriginPresetChange(event.target.value as SpriteRegion['originPreset'])
                }
              >
                {originPresetOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="field-grid">
              <NumberField
                label="Origin X"
                value={selectedRegion.originX}
                onChange={(value) => onOriginValueChange('originX', value)}
                min={0}
              />
              <NumberField
                label="Origin Y"
                value={selectedRegion.originY}
                onChange={(value) => onOriginValueChange('originY', value)}
                min={0}
              />
            </div>

            <button className="button" type="button" onClick={onResetRegion}>
              Reset Region
            </button>
          </>
        ) : (
          <div className="empty-state">
            <p>Select a region on the canvas or from the thumbnail list.</p>
          </div>
        )}
      </div>

      <div className="panel-section">
        <div className="panel-section__header">
          <h2>Sprite List</h2>
          <p>
            {validCount} valid / {regions.length} total
          </p>
        </div>

        <div className="thumbnail-grid">
          {regions.map((region) => {
            const scale = Math.min(72 / Math.max(region.width, 1), 72 / Math.max(region.height, 1), 1)

            return (
              <button
                key={region.id}
                type="button"
                className={`thumbnail ${selectedRegion?.index === region.index ? 'thumbnail--selected' : ''} ${
                  region.isValid ? '' : 'thumbnail--invalid'
                }`}
                onClick={() => onSelect(region.index)}
              >
                <div className={previewBackgroundClassName(previewBackground)}>
                  {image ? (
                    <div
                      className="thumbnail__sprite"
                      style={{
                        width: `${Math.max(1, region.width * scale)}px`,
                        height: `${Math.max(1, region.height * scale)}px`,
                        backgroundImage: `url(${image.objectUrl})`,
                        backgroundPosition: `${-region.x * scale}px ${-region.y * scale}px`,
                        backgroundSize: `${image.width * scale}px ${image.height * scale}px`,
                      }}
                    />
                  ) : null}
                </div>
                <span>#{region.index}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section__header">
          <h2>Export</h2>
          <p>Save single sprites, batch downloads, a ZIP, or metadata JSON.</p>
        </div>

        <div className="field-grid">
          <label className="field">
            <span className="field__label">Base Name</span>
            <input
              className="field__input"
              value={exportOptions.baseName}
              onChange={(event) => onExportOptionChange('baseName', event.target.value)}
            />
          </label>
          <NumberField
            label="Start Number"
            value={exportOptions.startNumber}
            onChange={(value) => onExportOptionChange('startNumber', Math.max(0, value))}
            min={0}
          />
          <NumberField
            label="Number Padding"
            value={exportOptions.padLength}
            onChange={(value) => onExportOptionChange('padLength', Math.max(1, value))}
            min={1}
          />
        </div>

        <div className="button-column">
          <button
            className="button button--primary"
            type="button"
            onClick={onExportSelected}
            disabled={!selectedRegion?.isValid}
          >
            Export Selected
          </button>
          <button className="button" type="button" onClick={onExportAll} disabled={validCount === 0}>
            Export All
          </button>
          <button className="button" type="button" onClick={onExportZip} disabled={validCount === 0}>
            Export ZIP
          </button>
          <button className="button" type="button" onClick={onExportJson} disabled={regions.length === 0}>
            Export JSON
          </button>
        </div>
      </div>
    </aside>
  )
}
