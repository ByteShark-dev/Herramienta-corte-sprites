import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from 'react'
import {
  clampZoom,
  drawSpriteSheetCanvas,
  fitViewToViewport,
  screenToImage,
  type CanvasViewState,
} from '../lib/canvasRenderer'
import type {
  LoadedSpriteSheetImage,
  OverlayOptions,
  Rect,
  SpriteRegion,
} from '../types/models'

interface CanvasWorkspaceProps {
  image: LoadedSpriteSheetImage | null
  regions: SpriteRegion[]
  selectedIndex: number | null
  overlayOptions: OverlayOptions
  usableBounds: Rect
  fitSequence: number
  onSelect: (index: number | null) => void
}

interface PanSession {
  startX: number
  startY: number
  startPanX: number
  startPanY: number
}

const INITIAL_VIEW_STATE: CanvasViewState = {
  zoom: 1,
  panX: 0,
  panY: 0,
}

export const CanvasWorkspace = ({
  image,
  regions,
  selectedIndex,
  overlayOptions,
  usableBounds,
  fitSequence,
  onSelect,
}: CanvasWorkspaceProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const panSessionRef = useRef<PanSession | null>(null)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })
  const [viewState, setViewState] = useState<CanvasViewState>(INITIAL_VIEW_STATE)

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return undefined
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) {
        return
      }

      setViewportSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })

    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!image || viewportSize.width <= 0 || viewportSize.height <= 0) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      setViewState(
        fitViewToViewport(viewportSize.width, viewportSize.height, image.width, image.height),
      )
    })

    return () => window.cancelAnimationFrame(frame)
  }, [image, fitSequence, viewportSize.height, viewportSize.width])

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const devicePixelRatio = window.devicePixelRatio || 1
    canvas.width = Math.max(1, Math.floor(viewportSize.width * devicePixelRatio))
    canvas.height = Math.max(1, Math.floor(viewportSize.height * devicePixelRatio))
    canvas.style.width = `${viewportSize.width}px`
    canvas.style.height = `${viewportSize.height}px`

    drawSpriteSheetCanvas({
      canvas,
      image: image?.element ?? null,
      regions,
      selectedIndex,
      overlayOptions,
      usableBounds,
      viewState,
    })
  }, [image, overlayOptions, regions, selectedIndex, usableBounds, viewState, viewportSize])

  const fitImage = () => {
    if (!image || viewportSize.width <= 0 || viewportSize.height <= 0) {
      return
    }

    setViewState(fitViewToViewport(viewportSize.width, viewportSize.height, image.width, image.height))
  }

  const zoomBy = (factor: number) => {
    if (!image) {
      return
    }

    const centerX = viewportSize.width / 2
    const centerY = viewportSize.height / 2
    const imagePoint = screenToImage(centerX, centerY, viewState)
    const nextZoom = clampZoom(viewState.zoom * factor)

    setViewState({
      zoom: nextZoom,
      panX: centerX - imagePoint.x * nextZoom,
      panY: centerY - imagePoint.y * nextZoom,
    })
  }

  const handleWheel = (event: WheelEvent<HTMLCanvasElement>) => {
    if (!image) {
      return
    }

    event.preventDefault()

    const rect = event.currentTarget.getBoundingClientRect()
    const cursorX = event.clientX - rect.left
    const cursorY = event.clientY - rect.top
    const imagePoint = screenToImage(cursorX, cursorY, viewState)
    const direction = event.deltaY < 0 ? 1.1 : 0.9
    const nextZoom = clampZoom(viewState.zoom * direction)

    setViewState({
      zoom: nextZoom,
      panX: cursorX - imagePoint.x * nextZoom,
      panY: cursorY - imagePoint.y * nextZoom,
    })
  }

  const hitTest = (canvasX: number, canvasY: number) => {
    if (!image) {
      return null
    }

    const imagePoint = screenToImage(canvasX, canvasY, viewState)

    for (const region of regions) {
      if (
        imagePoint.x >= region.x &&
        imagePoint.x <= region.x + region.width &&
        imagePoint.y >= region.y &&
        imagePoint.y <= region.y + region.height
      ) {
        return region.index
      }
    }

    return null
  }

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!image) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const canvasX = event.clientX - rect.left
    const canvasY = event.clientY - rect.top

    if (event.button === 1 || event.altKey) {
      panSessionRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        startPanX: viewState.panX,
        startPanY: viewState.panY,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
      return
    }

    if (event.button !== 0) {
      return
    }

    onSelect(hitTest(canvasX, canvasY))
  }

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const session = panSessionRef.current

    if (!session) {
      return
    }

    setViewState((previous) => ({
      ...previous,
      panX: session.startPanX + (event.clientX - session.startX),
      panY: session.startPanY + (event.clientY - session.startY),
    }))
  }

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    if (panSessionRef.current) {
      panSessionRef.current = null
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <section className="workspace">
      <div className="workspace__toolbar">
        <div className="button-row">
          <button className="button" type="button" onClick={() => zoomBy(0.8)} disabled={!image}>
            Zoom Out
          </button>
          <button className="button" type="button" onClick={() => zoomBy(1.25)} disabled={!image}>
            Zoom In
          </button>
          <button className="button" type="button" onClick={fitImage} disabled={!image}>
            Fit
          </button>
        </div>
        <div className="workspace__meta">
          <span>{image ? `Zoom ${Math.round(viewState.zoom * 100)}%` : 'No image'}</span>
          <span>Wheel = zoom</span>
          <span>Alt + drag = pan</span>
        </div>
      </div>

      <div className="workspace__canvas-shell" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="workspace__canvas"
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
    </section>
  )
}
