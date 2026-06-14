import JSZip from 'jszip'
import type { ExportOptions, SpriteRegion } from '../types/models'

const downloadBlob = (blob: Blob, fileName: string) => {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000)
}

export const getSpriteFileName = (
  exportOptions: ExportOptions,
  spriteIndex: number,
) =>
  `${exportOptions.baseName}_${String(exportOptions.startNumber + spriteIndex).padStart(
    exportOptions.padLength,
    '0',
  )}.png`

const cropRegionToBlob = async (
  image: HTMLImageElement,
  region: SpriteRegion,
): Promise<Blob> => {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(region.width))
  canvas.height = Math.max(1, Math.round(region.height))

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Unable to create a 2D canvas context for export.')
  }

  context.imageSmoothingEnabled = false
  context.drawImage(
    image,
    region.x,
    region.y,
    region.width,
    region.height,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png')
  })

  if (!blob) {
    throw new Error('The browser failed to encode the sprite as PNG.')
  }

  return blob
}

export const exportSelectedSprite = async (
  image: HTMLImageElement,
  region: SpriteRegion,
  exportOptions: ExportOptions,
) => {
  const blob = await cropRegionToBlob(image, region)
  downloadBlob(blob, getSpriteFileName(exportOptions, region.index))
}

export const exportAllSprites = async (
  image: HTMLImageElement,
  regions: SpriteRegion[],
  exportOptions: ExportOptions,
) => {
  for (const region of regions) {
    if (!region.isValid) {
      continue
    }

    const blob = await cropRegionToBlob(image, region)
    downloadBlob(blob, getSpriteFileName(exportOptions, region.index))
  }
}

export const exportSpriteZip = async (
  image: HTMLImageElement,
  regions: SpriteRegion[],
  exportOptions: ExportOptions,
) => {
  const zip = new JSZip()

  for (const region of regions) {
    if (!region.isValid) {
      continue
    }

    const blob = await cropRegionToBlob(image, region)
    zip.file(getSpriteFileName(exportOptions, region.index), blob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(zipBlob, `${exportOptions.baseName}.zip`)
}
