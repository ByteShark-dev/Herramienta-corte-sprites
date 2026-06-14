import type {
  LoadedSpriteSheetImage,
  OverlayOptions,
  SliceResult,
  SpriteSheetConfig,
} from '../types/models'
import { NumberField } from './NumberField'

interface ControlPanelProps {
  image: LoadedSpriteSheetImage | null
  config: SpriteSheetConfig
  result: SliceResult
  overlayOptions: OverlayOptions
  onConfigChange: (
    field: keyof SpriteSheetConfig,
    value: boolean | number | SpriteSheetConfig['mode'],
  ) => void
  onOverlayChange: (field: keyof OverlayOptions, value: boolean) => void
  onLoadImage: (file: File) => void
  onAutoSlice: () => void
  onReset: () => void
}

export const ControlPanel = ({
  image,
  config,
  result,
  overlayOptions,
  onConfigChange,
  onOverlayChange,
  onLoadImage,
  onAutoSlice,
  onReset,
}: ControlPanelProps) => {
  const hasImage = Boolean(image)
  const imageResolution = image ? `${image.width} x ${image.height}` : 'Unavailable'

  return (
    <aside className="app-panel app-panel--left">
      <div className="panel-section">
        <div className="panel-section__header">
          <h2>Source</h2>
          <p>Load a sprite sheet and set the slicing rules.</p>
        </div>

        <label className="upload-field">
          <span className="button button--primary">Load Image</span>
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                onLoadImage(file)
              }
              event.target.value = ''
            }}
          />
        </label>

        <div className="info-card">
          <div>
            <span className="info-card__label">File</span>
            <strong>{image?.fileName ?? 'No image loaded'}</strong>
          </div>
          <div>
            <span className="info-card__label">Resolution</span>
            <strong>{imageResolution}</strong>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section__header">
          <h2>Slicing</h2>
          <p>Switch between fixed tile size and fixed grid counts.</p>
        </div>

        <label className="field">
          <span className="field__label">Mode</span>
          <select
            className="field__input"
            value={config.mode}
            onChange={(event) => onConfigChange('mode', event.target.value as SpriteSheetConfig['mode'])}
            disabled={!hasImage}
          >
            <option value="tileSize">Tile Size</option>
            <option value="gridCount">Grid Count</option>
          </select>
        </label>

        <div className="field-grid">
          <NumberField
            label="Tile Width"
            value={config.tileWidth}
            onChange={(value) => onConfigChange('tileWidth', Math.max(0, value))}
            disabled={!hasImage}
            min={0}
            step={1}
          />
          <NumberField
            label="Tile Height"
            value={config.tileHeight}
            onChange={(value) => onConfigChange('tileHeight', Math.max(0, value))}
            disabled={!hasImage}
            min={0}
            step={1}
          />
          <NumberField
            label="Columns"
            value={config.columns}
            onChange={(value) => onConfigChange('columns', Math.max(0, value))}
            disabled={!hasImage}
            min={0}
            step={1}
            hint={config.mode === 'tileSize' ? '0 = auto' : undefined}
          />
          <NumberField
            label="Rows"
            value={config.rows}
            onChange={(value) => onConfigChange('rows', Math.max(0, value))}
            disabled={!hasImage}
            min={0}
            step={1}
            hint={config.mode === 'tileSize' ? '0 = auto' : undefined}
          />
        </div>

        <div className="field-grid">
          <NumberField
            label="Offset Top"
            value={config.offsetTop}
            onChange={(value) => onConfigChange('offsetTop', Math.max(0, value))}
            disabled={!hasImage}
            min={0}
          />
          <NumberField
            label="Offset Left"
            value={config.offsetLeft}
            onChange={(value) => onConfigChange('offsetLeft', Math.max(0, value))}
            disabled={!hasImage}
            min={0}
          />
          <NumberField
            label="Spacing X"
            value={config.spacingX}
            onChange={(value) => onConfigChange('spacingX', Math.max(0, value))}
            disabled={!hasImage}
            min={0}
          />
          <NumberField
            label="Spacing Y"
            value={config.spacingY}
            onChange={(value) => onConfigChange('spacingY', Math.max(0, value))}
            disabled={!hasImage}
            min={0}
          />
          <NumberField
            label="Padding Right"
            value={config.paddingRight}
            onChange={(value) => onConfigChange('paddingRight', Math.max(0, value))}
            disabled={!hasImage}
            min={0}
          />
          <NumberField
            label="Padding Bottom"
            value={config.paddingBottom}
            onChange={(value) => onConfigChange('paddingBottom', Math.max(0, value))}
            disabled={!hasImage}
            min={0}
          />
        </div>

        <div className="button-row">
          <button className="button" type="button" onClick={onAutoSlice} disabled={!hasImage}>
            Auto Slice
          </button>
          <button className="button" type="button" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section__header">
          <h2>Overlay</h2>
          <p>Control what is visible on top of the sprite sheet.</p>
        </div>

        <label className="toggle">
          <input
            type="checkbox"
            checked={overlayOptions.showGrid}
            onChange={(event) => onOverlayChange('showGrid', event.target.checked)}
            disabled={!hasImage}
          />
          <span>Show grid</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={overlayOptions.showIndices}
            onChange={(event) => onOverlayChange('showIndices', event.target.checked)}
            disabled={!hasImage}
          />
          <span>Show indices</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={overlayOptions.showOutsideArea}
            onChange={(event) => onOverlayChange('showOutsideArea', event.target.checked)}
            disabled={!hasImage}
          />
          <span>Show ignored margins</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={config.snapToPixel}
            onChange={(event) => onConfigChange('snapToPixel', event.target.checked)}
            disabled={!hasImage}
          />
          <span>Snap to pixel</span>
        </label>
      </div>

      <div className="panel-section">
        <div className="panel-section__header">
          <h2>Summary</h2>
          <p>Computed values based on the current image and rules.</p>
        </div>

        <div className="summary-grid">
          <div className="metric">
            <span>Sprites</span>
            <strong>{result.regions.length}</strong>
          </div>
          <div className="metric">
            <span>Grid</span>
            <strong>
              {result.computedColumns} x {result.computedRows}
            </strong>
          </div>
          <div className="metric">
            <span>Tile</span>
            <strong>
              {result.computedTileWidth} x {result.computedTileHeight}
            </strong>
          </div>
          <div className="metric">
            <span>Usable</span>
            <strong>
              {result.usableBounds.width} x {result.usableBounds.height}
            </strong>
          </div>
        </div>

        {result.warnings.length > 0 ? (
          <div className="warning-list">
            {result.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  )
}
