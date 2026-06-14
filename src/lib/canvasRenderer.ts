import type { OverlayOptions, Rect, SpriteRegion } from '../types/models'

export interface CanvasViewState {
  zoom: number
  panX: number
  panY: number
}

interface DrawCanvasOptions {
  canvas: HTMLCanvasElement
  image: HTMLImageElement | null
  regions: SpriteRegion[]
  selectedIndex: number | null
  overlayOptions: OverlayOptions
  usableBounds: Rect
  viewState: CanvasViewState
}

const BACKGROUND_COLOR = '#0c1017'
const GRID_LIGHT = '#182131'
const GRID_DARK = '#111924'

export const clampZoom = (zoom: number) => Math.min(48, Math.max(0.05, zoom))

export const fitViewToViewport = (
  viewportWidth: number,
  viewportHeight: number,
  imageWidth: number,
  imageHeight: number,
): CanvasViewState => {
  if (viewportWidth <= 0 || viewportHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    return {
      zoom: 1,
      panX: 0,
      panY: 0,
    }
  }

  const padding = 32
  const zoom = clampZoom(
    Math.min(
      (viewportWidth - padding * 2) / imageWidth,
      (viewportHeight - padding * 2) / imageHeight,
    ),
  )

  return {
    zoom,
    panX: (viewportWidth - imageWidth * zoom) / 2,
    panY: (viewportHeight - imageHeight * zoom) / 2,
  }
}

export const screenToImage = (
  x: number,
  y: number,
  viewState: CanvasViewState,
) => ({
  x: (x - viewState.panX) / viewState.zoom,
  y: (y - viewState.panY) / viewState.zoom,
})

const imageToScreen = (
  x: number,
  y: number,
  viewState: CanvasViewState,
) => ({
  x: viewState.panX + x * viewState.zoom,
  y: viewState.panY + y * viewState.zoom,
})

const drawViewportBackground = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) => {
  context.fillStyle = BACKGROUND_COLOR
  context.fillRect(0, 0, width, height)

  const patternSize = 28
  for (let y = 0; y < height; y += patternSize) {
    for (let x = 0; x < width; x += patternSize) {
      context.fillStyle = (x / patternSize + y / patternSize) % 2 === 0 ? GRID_DARK : GRID_LIGHT
      context.fillRect(x, y, patternSize, patternSize)
    }
  }
}

const drawCheckerboard = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const cellSize = 12
  for (let row = 0; row < height; row += cellSize) {
    for (let column = 0; column < width; column += cellSize) {
      context.fillStyle = (row / cellSize + column / cellSize) % 2 === 0 ? '#1b2230' : '#222c3c'
      context.fillRect(x + column, y + row, cellSize, cellSize)
    }
  }
}

const drawOutsideAreaMask = (
  context: CanvasRenderingContext2D,
  imageWidth: number,
  imageHeight: number,
  usableBounds: Rect,
) => {
  context.save()
  context.fillStyle = 'rgba(9, 12, 17, 0.6)'
  context.fillRect(0, 0, imageWidth, usableBounds.y)
  context.fillRect(0, usableBounds.y, usableBounds.x, usableBounds.height)

  const rightStart = usableBounds.x + usableBounds.width
  const bottomStart = usableBounds.y + usableBounds.height

  context.fillRect(rightStart, usableBounds.y, imageWidth - rightStart, usableBounds.height)
  context.fillRect(0, bottomStart, imageWidth, imageHeight - bottomStart)
  context.restore()
}

export const drawSpriteSheetCanvas = ({
  canvas,
  image,
  regions,
  selectedIndex,
  overlayOptions,
  usableBounds,
  viewState,
}: DrawCanvasOptions) => {
  const context = canvas.getContext('2d')

  if (!context) {
    return
  }

  const devicePixelRatio = window.devicePixelRatio || 1
  const viewportWidth = canvas.width / devicePixelRatio
  const viewportHeight = canvas.height / devicePixelRatio

  context.setTransform(1, 0, 0, 1, 0, 0)
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.scale(devicePixelRatio, devicePixelRatio)

  drawViewportBackground(context, viewportWidth, viewportHeight)

  if (!image) {
    context.fillStyle = '#d5dde9'
    context.font = '600 18px "Segoe UI", sans-serif'
    context.textAlign = 'center'
    context.fillText('Load a sprite sheet to start slicing.', viewportWidth / 2, viewportHeight / 2)
    return
  }

  context.save()
  context.translate(viewState.panX, viewState.panY)
  context.scale(viewState.zoom, viewState.zoom)

  drawCheckerboard(context, 0, 0, image.naturalWidth, image.naturalHeight)
  context.imageSmoothingEnabled = false
  context.drawImage(image, 0, 0)

  if (overlayOptions.showOutsideArea) {
    drawOutsideAreaMask(context, image.naturalWidth, image.naturalHeight, usableBounds)
  }

  context.strokeStyle = '#334051'
  context.lineWidth = 1 / viewState.zoom
  context.strokeRect(0, 0, image.naturalWidth, image.naturalHeight)

  context.restore()

  const regionsToDraw = overlayOptions.showGrid
    ? regions
    : regions.filter((region) => region.index === selectedIndex)

  for (const region of regionsToDraw) {
    const topLeft = imageToScreen(region.x, region.y, viewState)
    const width = region.width * viewState.zoom
    const height = region.height * viewState.zoom

    context.save()
    context.strokeStyle = region.isValid ? 'rgba(97, 198, 255, 0.95)' : 'rgba(255, 99, 99, 0.95)'
    context.fillStyle = region.isValid ? 'rgba(97, 198, 255, 0.12)' : 'rgba(255, 99, 99, 0.16)'
    context.lineWidth = region.index === selectedIndex ? 2.5 : 1.25
    context.strokeRect(topLeft.x, topLeft.y, width, height)
    context.fillRect(topLeft.x, topLeft.y, width, height)

    if (overlayOptions.showIndices && width > 26 && height > 18) {
      context.fillStyle = '#f6fbff'
      context.font = '600 12px "Segoe UI", sans-serif'
      context.textAlign = 'left'
      context.fillText(String(region.index), topLeft.x + 6, topLeft.y + 16)
    }

    if (region.index === selectedIndex) {
      context.strokeStyle = '#ffd166'
      context.lineWidth = 2.5
      context.strokeRect(topLeft.x - 1, topLeft.y - 1, width + 2, height + 2)
    }

    context.restore()
  }

  if (selectedIndex !== null) {
    const selectedRegion = regions[selectedIndex]

    if (selectedRegion) {
      const originScreen = imageToScreen(
        selectedRegion.x + selectedRegion.originX,
        selectedRegion.y + selectedRegion.originY,
        viewState,
      )

      context.save()
      context.strokeStyle = '#ff9f43'
      context.lineWidth = 2
      context.beginPath()
      context.moveTo(originScreen.x - 10, originScreen.y)
      context.lineTo(originScreen.x + 10, originScreen.y)
      context.moveTo(originScreen.x, originScreen.y - 10)
      context.lineTo(originScreen.x, originScreen.y + 10)
      context.stroke()

      context.fillStyle = '#ff9f43'
      context.beginPath()
      context.arc(originScreen.x, originScreen.y, 3.5, 0, Math.PI * 2)
      context.fill()
      context.restore()
    }
  }
}
