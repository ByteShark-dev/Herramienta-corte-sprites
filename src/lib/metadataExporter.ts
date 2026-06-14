import type { ExportOptions, SliceResult } from '../types/models'

export interface SpriteMetadataDocument {
  image: string
  spriteCount: number
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
  sprites: Array<{
    name: string
    index: number
    row: number
    column: number
    x: number
    y: number
    width: number
    height: number
    originX: number
    originY: number
    originPreset: string
    isValid: boolean
    isManualOverride: boolean
  }>
}

const downloadBlob = (blob: Blob, fileName: string) => {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000)
}

export const buildSpriteMetadata = (
  result: SliceResult,
  exportOptions: ExportOptions,
  config: {
    offsetTop: number
    offsetLeft: number
    spacingX: number
    spacingY: number
    paddingRight: number
    paddingBottom: number
  },
): SpriteMetadataDocument => ({
  image: exportOptions.imageName,
  spriteCount: result.regions.length,
  tileWidth: result.computedTileWidth,
  tileHeight: result.computedTileHeight,
  columns: result.computedColumns,
  rows: result.computedRows,
  offsetTop: config.offsetTop,
  offsetLeft: config.offsetLeft,
  spacingX: config.spacingX,
  spacingY: config.spacingY,
  paddingRight: config.paddingRight,
  paddingBottom: config.paddingBottom,
  sprites: result.regions.map((region) => ({
    name: `${exportOptions.baseName}_${String(exportOptions.startNumber + region.index).padStart(
      exportOptions.padLength,
      '0',
    )}`,
    index: region.index,
    row: region.row,
    column: region.column,
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
    originX: region.originX,
    originY: region.originY,
    originPreset: region.originPreset,
    isValid: region.isValid,
    isManualOverride: region.isManualOverride,
  })),
})

export const exportMetadataJson = (
  result: SliceResult,
  exportOptions: ExportOptions,
  config: {
    offsetTop: number
    offsetLeft: number
    spacingX: number
    spacingY: number
    paddingRight: number
    paddingBottom: number
  },
) => {
  const metadata = buildSpriteMetadata(result, exportOptions, config)
  const json = JSON.stringify(metadata, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  downloadBlob(blob, `${exportOptions.baseName}.json`)
}
