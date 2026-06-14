import { describe, expect, it } from 'vitest'
import { calculateSpriteRegions, createDefaultConfig } from './sliceCalculator'

describe('calculateSpriteRegions', () => {
  it('calculates fixed-size tiles with offsets and spacing', () => {
    const config = {
      ...createDefaultConfig(256, 128),
      mode: 'tileSize' as const,
      imageWidth: 256,
      imageHeight: 128,
      tileWidth: 32,
      tileHeight: 32,
      columns: 0,
      rows: 0,
      offsetTop: 8,
      offsetLeft: 16,
      spacingX: 4,
      spacingY: 2,
      paddingRight: 16,
      paddingBottom: 8,
      snapToPixel: true,
    }

    const result = calculateSpriteRegions(config, {}, {})

    expect(result.computedColumns).toBe(6)
    expect(result.computedRows).toBe(3)
    expect(result.regions).toHaveLength(18)
    expect(result.regions[0]).toMatchObject({
      x: 16,
      y: 8,
      width: 32,
      height: 32,
      isValid: true,
    })
  })

  it('warns when grid-count mode produces fractional tiles', () => {
    const config = {
      ...createDefaultConfig(100, 50),
      mode: 'gridCount' as const,
      imageWidth: 100,
      imageHeight: 50,
      columns: 3,
      rows: 2,
      spacingX: 1,
      spacingY: 0,
      snapToPixel: false,
    }

    const result = calculateSpriteRegions(config, {}, {})

    expect(result.hasFractionalTiles).toBe(true)
    expect(result.warnings[0]).toContain('decimals')
    expect(result.computedTileWidth).toBeCloseTo(32.667, 3)
  })

  it('applies manual region overrides on top of automatic slicing', () => {
    const config = {
      ...createDefaultConfig(128, 64),
      mode: 'tileSize' as const,
      imageWidth: 128,
      imageHeight: 64,
      tileWidth: 32,
      tileHeight: 32,
      columns: 4,
      rows: 2,
      snapToPixel: true,
    }

    const result = calculateSpriteRegions(
      config,
      {
        1: {
          x: 40,
          y: 4,
          width: 28,
          height: 24,
        },
      },
      {
        1: {
          preset: 'custom',
          originX: 4,
          originY: 8,
        },
      },
    )

    expect(result.regions[1]).toMatchObject({
      x: 40,
      y: 4,
      width: 28,
      height: 24,
      isManualOverride: true,
      originX: 4,
      originY: 8,
    })
  })
})
