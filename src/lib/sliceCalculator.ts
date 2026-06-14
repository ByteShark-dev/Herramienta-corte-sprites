import type {
  OriginPreset,
  Rect,
  SliceResult,
  SpriteManualOverride,
  SpriteOriginOverride,
  SpriteRegion,
  SpriteSheetConfig,
} from '../types/models'

const DEFAULT_TILE_SIZE = 64

const roundToPrecision = (value: number) => Math.round(value * 1000) / 1000

const normalizeValue = (value: number, snapToPixel: boolean) =>
  snapToPixel ? Math.round(value) : roundToPrecision(value)

export const createDefaultConfig = (
  imageWidth = 0,
  imageHeight = 0,
): SpriteSheetConfig => {
  const tileWidth = imageWidth > 0 ? Math.min(DEFAULT_TILE_SIZE, imageWidth) : DEFAULT_TILE_SIZE
  const tileHeight =
    imageHeight > 0 ? Math.min(DEFAULT_TILE_SIZE, imageHeight) : DEFAULT_TILE_SIZE

  return {
    mode: 'tileSize',
    imageWidth,
    imageHeight,
    tileWidth,
    tileHeight,
    columns: imageWidth > 0 ? Math.max(1, Math.floor(imageWidth / tileWidth)) : 1,
    rows: imageHeight > 0 ? Math.max(1, Math.floor(imageHeight / tileHeight)) : 1,
    offsetTop: 0,
    offsetLeft: 0,
    spacingX: 0,
    spacingY: 0,
    paddingRight: 0,
    paddingBottom: 0,
    snapToPixel: true,
  }
}

export const getOriginFromPreset = (
  preset: OriginPreset,
  width: number,
  height: number,
  snapToPixel: boolean,
) => {
  const halfWidth = width / 2
  const halfHeight = height / 2

  let originX = halfWidth
  let originY = halfHeight

  switch (preset) {
    case 'top-left':
      originX = 0
      originY = 0
      break
    case 'top-center':
      originX = halfWidth
      originY = 0
      break
    case 'top-right':
      originX = width
      originY = 0
      break
    case 'center-left':
      originX = 0
      originY = halfHeight
      break
    case 'center':
      originX = halfWidth
      originY = halfHeight
      break
    case 'center-right':
      originX = width
      originY = halfHeight
      break
    case 'bottom-left':
      originX = 0
      originY = height
      break
    case 'bottom-center':
      originX = halfWidth
      originY = height
      break
    case 'bottom-right':
      originX = width
      originY = height
      break
    case 'custom':
      break
  }

  return {
    originX: normalizeValue(originX, snapToPixel),
    originY: normalizeValue(originY, snapToPixel),
  }
}

const getValidationMessage = (
  region: Pick<SpriteRegion, 'x' | 'y' | 'width' | 'height'>,
  imageWidth: number,
  imageHeight: number,
) => {
  if (region.width <= 0 || region.height <= 0) {
    return 'Sprite dimensions must be greater than zero.'
  }

  if (region.x < 0 || region.y < 0) {
    return 'Sprite origin is outside the image.'
  }

  if (region.x + region.width > imageWidth || region.y + region.height > imageHeight) {
    return 'Sprite exceeds the image bounds.'
  }

  return undefined
}

const computeCountsFromTileSize = (
  workSize: number,
  tileSize: number,
  spacing: number,
) => {
  if (tileSize <= 0) {
    return 0
  }

  return Math.max(0, Math.floor((workSize + spacing) / (tileSize + spacing)))
}

const buildUsableBounds = (config: SpriteSheetConfig): Rect => ({
  x: config.offsetLeft,
  y: config.offsetTop,
  width: Math.max(0, config.imageWidth - config.offsetLeft - config.paddingRight),
  height: Math.max(0, config.imageHeight - config.offsetTop - config.paddingBottom),
})

export const calculateSpriteRegions = (
  config: SpriteSheetConfig,
  manualOverrides: Record<number, SpriteManualOverride>,
  originOverrides: Record<number, SpriteOriginOverride>,
): SliceResult => {
  const warnings: string[] = []
  const usableBounds = buildUsableBounds(config)

  if (config.imageWidth <= 0 || config.imageHeight <= 0) {
    return {
      regions: [],
      computedTileWidth: config.tileWidth,
      computedTileHeight: config.tileHeight,
      computedColumns: 0,
      computedRows: 0,
      usableBounds,
      warnings,
      hasFractionalTiles: false,
    }
  }

  let computedColumns = Math.max(0, Math.floor(config.columns))
  let computedRows = Math.max(0, Math.floor(config.rows))
  let computedTileWidth = config.tileWidth
  let computedTileHeight = config.tileHeight
  let hasFractionalTiles = false

  if (config.mode === 'gridCount') {
    if (computedColumns <= 0 || computedRows <= 0) {
      warnings.push('Columns and rows must be greater than zero in Grid Count mode.')

      return {
        regions: [],
        computedTileWidth,
        computedTileHeight,
        computedColumns: 0,
        computedRows: 0,
        usableBounds,
        warnings,
        hasFractionalTiles: false,
      }
    }

    const rawUsableWidth = usableBounds.width - config.spacingX * Math.max(0, computedColumns - 1)
    const rawUsableHeight =
      usableBounds.height - config.spacingY * Math.max(0, computedRows - 1)

    computedTileWidth = rawUsableWidth / computedColumns
    computedTileHeight = rawUsableHeight / computedRows

    hasFractionalTiles =
      !Number.isInteger(computedTileWidth) || !Number.isInteger(computedTileHeight)

    if (hasFractionalTiles) {
      warnings.push('Computed tile size contains decimals. Enable Snap To Pixel to round output.')
    }
  } else {
    if (computedTileWidth <= 0 || computedTileHeight <= 0) {
      warnings.push('Tile width and tile height must be greater than zero.')

      return {
        regions: [],
        computedTileWidth,
        computedTileHeight,
        computedColumns: 0,
        computedRows: 0,
        usableBounds,
        warnings,
        hasFractionalTiles: false,
      }
    }

    if (computedColumns <= 0) {
      computedColumns = computeCountsFromTileSize(
        usableBounds.width,
        computedTileWidth,
        config.spacingX,
      )
    }

    if (computedRows <= 0) {
      computedRows = computeCountsFromTileSize(
        usableBounds.height,
        computedTileHeight,
        config.spacingY,
      )
    }
  }

  const regions: SpriteRegion[] = []

  for (let row = 0; row < computedRows; row += 1) {
    for (let column = 0; column < computedColumns; column += 1) {
      const index = row * computedColumns + column
      const rawRegion = {
        x: config.offsetLeft + column * (computedTileWidth + config.spacingX),
        y: config.offsetTop + row * (computedTileHeight + config.spacingY),
        width: computedTileWidth,
        height: computedTileHeight,
      }

      const manualRegion = manualOverrides[index]
      const resolvedRegion = manualRegion
        ? manualRegion
        : {
            x: normalizeValue(rawRegion.x, config.snapToPixel),
            y: normalizeValue(rawRegion.y, config.snapToPixel),
            width: normalizeValue(rawRegion.width, config.snapToPixel),
            height: normalizeValue(rawRegion.height, config.snapToPixel),
          }

      const originOverride = originOverrides[index]
      const originPreset = originOverride?.preset ?? 'center'
      const presetOrigin = getOriginFromPreset(
        originPreset,
        resolvedRegion.width,
        resolvedRegion.height,
        config.snapToPixel,
      )

      const originX =
        originPreset === 'custom'
          ? normalizeValue(originOverride?.originX ?? presetOrigin.originX, config.snapToPixel)
          : presetOrigin.originX
      const originY =
        originPreset === 'custom'
          ? normalizeValue(originOverride?.originY ?? presetOrigin.originY, config.snapToPixel)
          : presetOrigin.originY

      const validationMessage = getValidationMessage(
        resolvedRegion,
        config.imageWidth,
        config.imageHeight,
      )

      regions.push({
        id: `sprite-${index}`,
        index,
        row,
        column,
        x: resolvedRegion.x,
        y: resolvedRegion.y,
        width: resolvedRegion.width,
        height: resolvedRegion.height,
        originX,
        originY,
        originPreset,
        isManualOverride: Boolean(manualRegion),
        isValid: !validationMessage,
        validationMessage,
      })
    }
  }

  if (regions.length === 0) {
    warnings.push('No sprites were generated with the current configuration.')
  }

  return {
    regions,
    computedTileWidth: normalizeValue(computedTileWidth, config.snapToPixel),
    computedTileHeight: normalizeValue(computedTileHeight, config.snapToPixel),
    computedColumns,
    computedRows,
    usableBounds,
    warnings,
    hasFractionalTiles,
  }
}
