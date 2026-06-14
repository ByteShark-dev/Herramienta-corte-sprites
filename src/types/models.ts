export type SliceMode = 'tileSize' | 'gridCount'

export type OriginPreset =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'custom'

export type PreviewBackground = 'checker' | 'black' | 'white'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface SpriteSheetConfig {
  mode: SliceMode
  imageWidth: number
  imageHeight: number
  tileWidth: number
  tileHeight: number
  columns: number
  rows: number
  offsetTop: number
  offsetLeft: number
  spacingX: number
  spacingY: number
  paddingRight: number
  paddingBottom: number
  snapToPixel: boolean
}

export interface SpriteManualOverride {
  x: number
  y: number
  width: number
  height: number
}

export interface SpriteOriginOverride {
  preset: OriginPreset
  originX?: number
  originY?: number
}

export interface SpriteRegion extends SpriteManualOverride {
  id: string
  index: number
  row: number
  column: number
  originX: number
  originY: number
  originPreset: OriginPreset
  isManualOverride: boolean
  isValid: boolean
  validationMessage?: string
}

export interface SliceResult {
  regions: SpriteRegion[]
  computedTileWidth: number
  computedTileHeight: number
  computedColumns: number
  computedRows: number
  usableBounds: Rect
  warnings: string[]
  hasFractionalTiles: boolean
}

export interface OverlayOptions {
  showGrid: boolean
  showIndices: boolean
  showOutsideArea: boolean
}

export interface ExportOptions {
  baseName: string
  startNumber: number
  padLength: number
  imageName: string
}

export interface LoadedSpriteSheetImage {
  element: HTMLImageElement
  fileName: string
  objectUrl: string
  width: number
  height: number
}

export const originPresetOptions: Array<{
  value: OriginPreset
  label: string
}> = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'center-left', label: 'Center Left' },
  { value: 'center', label: 'Center' },
  { value: 'center-right', label: 'Center Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'custom', label: 'Custom' },
]
