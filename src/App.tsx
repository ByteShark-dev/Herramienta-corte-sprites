import { useEffect, useEffectEvent, useState } from 'react'
import './App.css'
import { CanvasWorkspace } from './components/CanvasWorkspace'
import { ControlPanel } from './components/ControlPanel'
import { PreviewPanel } from './components/PreviewPanel'
import { exportMetadataJson } from './lib/metadataExporter'
import { loadImageFile } from './lib/imageLoader'
import {
  calculateSpriteRegions,
  createDefaultConfig,
} from './lib/sliceCalculator'
import {
  exportAllSprites,
  exportSelectedSprite,
  exportSpriteZip,
} from './lib/spriteExporter'
import type {
  ExportOptions,
  LoadedSpriteSheetImage,
  OverlayOptions,
  PreviewBackground,
  SpriteManualOverride,
  SpriteOriginOverride,
  SpriteSheetConfig,
} from './types/models'

function App() {
  const [image, setImage] = useState<LoadedSpriteSheetImage | null>(null)
  const [config, setConfig] = useState<SpriteSheetConfig>(() => createDefaultConfig())
  const [manualOverrides, setManualOverrides] = useState<Record<number, SpriteManualOverride>>({})
  const [originOverrides, setOriginOverrides] = useState<Record<number, SpriteOriginOverride>>({})
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [overlayOptions, setOverlayOptions] = useState<OverlayOptions>({
    showGrid: true,
    showIndices: true,
    showOutsideArea: true,
  })
  const [previewBackground, setPreviewBackground] =
    useState<PreviewBackground>('checker')
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    baseName: 'sprite',
    startNumber: 1,
    padLength: 3,
    imageName: '',
  })
  const [statusMessage, setStatusMessage] = useState(
    'Load a sprite sheet to start slicing.',
  )
  const [fitSequence, setFitSequence] = useState(0)

  const sliceResult = calculateSpriteRegions(config, manualOverrides, originOverrides)
  const resolvedSelectedIndex =
    selectedIndex !== null && sliceResult.regions[selectedIndex]
      ? selectedIndex
      : sliceResult.regions.length > 0
        ? 0
        : null
  const selectedRegion =
    resolvedSelectedIndex !== null
      ? sliceResult.regions[resolvedSelectedIndex] ?? null
      : null

  const updateSelectedRegion = (
    field: keyof SpriteManualOverride,
    value: number,
  ) => {
    if (!selectedRegion) {
      return
    }

    setManualOverrides((previous) => ({
      ...previous,
      [selectedRegion.index]: {
        x: field === 'x' ? value : selectedRegion.x,
        y: field === 'y' ? value : selectedRegion.y,
        width: field === 'width' ? value : selectedRegion.width,
        height: field === 'height' ? value : selectedRegion.height,
      },
    }))
  }

  useEffect(
    () => () => {
      if (image?.objectUrl) {
        URL.revokeObjectURL(image.objectUrl)
      }
    },
    [image],
  )

  const handleArrowKey = useEffectEvent((event: KeyboardEvent) => {
    if (!selectedRegion) {
      return
    }

    const target = event.target as HTMLElement | null
    if (
      target &&
      ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName)
    ) {
      return
    }

    const distance = event.shiftKey ? 10 : 1

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        updateSelectedRegion('x', selectedRegion.x - distance)
        break
      case 'ArrowRight':
        event.preventDefault()
        updateSelectedRegion('x', selectedRegion.x + distance)
        break
      case 'ArrowUp':
        event.preventDefault()
        updateSelectedRegion('y', selectedRegion.y - distance)
        break
      case 'ArrowDown':
        event.preventDefault()
        updateSelectedRegion('y', selectedRegion.y + distance)
        break
      default:
        break
    }
  })

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      handleArrowKey(event)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const updateConfig = (
    field: keyof SpriteSheetConfig,
    value: boolean | number | SpriteSheetConfig['mode'],
  ) => {
    setConfig((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const updateOverlay = (field: keyof OverlayOptions, value: boolean) => {
    setOverlayOptions((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const updateExportOptions = (
    field: keyof ExportOptions,
    value: number | string,
  ) => {
    setExportOptions((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const resetForImage = (loadedImage: LoadedSpriteSheetImage) => {
    setConfig(createDefaultConfig(loadedImage.width, loadedImage.height))
    setManualOverrides({})
    setOriginOverrides({})
    setSelectedIndex(null)
    setFitSequence((previous) => previous + 1)
  }

  const handleLoadImage = async (file: File) => {
    try {
      const loadedImage = await loadImageFile(file)

      if (image?.objectUrl) {
        URL.revokeObjectURL(image.objectUrl)
      }

      setImage(loadedImage)
      resetForImage(loadedImage)
      setExportOptions((previous) => ({
        ...previous,
        baseName: file.name.replace(/\.[^.]+$/, '') || 'sprite',
        imageName: file.name,
      }))
      setStatusMessage(
        `Loaded ${file.name} (${loadedImage.width} x ${loadedImage.height}).`,
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load the image.'
      setStatusMessage(message)
    }
  }

  const handleAutoSlice = () => {
    setManualOverrides({})
    setStatusMessage('Automatic slicing restored. Manual region edits were cleared.')
  }

  const handleReset = () => {
    if (image) {
      resetForImage(image)
      setStatusMessage('Configuration reset to defaults for the current image.')
      return
    }

    setConfig(createDefaultConfig())
    setManualOverrides({})
    setOriginOverrides({})
    setSelectedIndex(null)
    setStatusMessage('Configuration reset.')
  }

  const resetSelectedRegion = () => {
    if (!selectedRegion) {
      return
    }

    setManualOverrides((previous) => {
      const next = { ...previous }
      delete next[selectedRegion.index]
      return next
    })
  }

  const updateSelectedOriginPreset = (preset: SpriteOriginOverride['preset']) => {
    if (!selectedRegion) {
      return
    }

    setOriginOverrides((previous) => ({
      ...previous,
      [selectedRegion.index]:
        preset === 'custom'
          ? {
              preset,
              originX: selectedRegion.originX,
              originY: selectedRegion.originY,
            }
          : { preset },
    }))
  }

  const updateSelectedOriginValue = (
    field: 'originX' | 'originY',
    value: number,
  ) => {
    if (!selectedRegion) {
      return
    }

    setOriginOverrides((previous) => ({
      ...previous,
      [selectedRegion.index]: {
        preset: 'custom',
        originX: field === 'originX' ? value : selectedRegion.originX,
        originY: field === 'originY' ? value : selectedRegion.originY,
      },
    }))
  }

  const handleExportSelected = async () => {
    if (!image || !selectedRegion?.isValid) {
      return
    }

    await exportSelectedSprite(image.element, selectedRegion, exportOptions)
    setStatusMessage(`Exported sprite #${selectedRegion.index}.`)
  }

  const handleExportAll = async () => {
    if (!image) {
      return
    }

    await exportAllSprites(image.element, sliceResult.regions, exportOptions)
    setStatusMessage('Triggered PNG downloads for every valid sprite.')
  }

  const handleExportZip = async () => {
    if (!image) {
      return
    }

    await exportSpriteZip(image.element, sliceResult.regions, exportOptions)
    setStatusMessage('Exported a ZIP with every valid sprite.')
  }

  const handleExportJson = () => {
    exportMetadataJson(sliceResult, exportOptions, {
      offsetTop: config.offsetTop,
      offsetLeft: config.offsetLeft,
      spacingX: config.spacingX,
      spacingY: config.spacingY,
      paddingRight: config.paddingRight,
      paddingBottom: config.paddingBottom,
    })
    setStatusMessage('Exported metadata JSON.')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Sprite Sheet Cutter</p>
          <h1>GameMaker-style sprite slicing, locally in the browser.</h1>
        </div>
        <div className="status-pill">{statusMessage}</div>
      </header>

      <main className="app-layout">
        <ControlPanel
          image={image}
          config={config}
          result={sliceResult}
          overlayOptions={overlayOptions}
          onConfigChange={updateConfig}
          onOverlayChange={updateOverlay}
          onLoadImage={handleLoadImage}
          onAutoSlice={handleAutoSlice}
          onReset={handleReset}
        />

        <CanvasWorkspace
          image={image}
          regions={sliceResult.regions}
          selectedIndex={resolvedSelectedIndex}
          overlayOptions={overlayOptions}
          usableBounds={sliceResult.usableBounds}
          fitSequence={fitSequence}
          onSelect={setSelectedIndex}
        />

        <PreviewPanel
          image={image}
          regions={sliceResult.regions}
          selectedRegion={selectedRegion}
          previewBackground={previewBackground}
          exportOptions={exportOptions}
          onPreviewBackgroundChange={setPreviewBackground}
          onExportOptionChange={updateExportOptions}
          onSelect={setSelectedIndex}
          onRegionChange={updateSelectedRegion}
          onOriginPresetChange={updateSelectedOriginPreset}
          onOriginValueChange={updateSelectedOriginValue}
          onResetRegion={resetSelectedRegion}
          onExportSelected={handleExportSelected}
          onExportAll={handleExportAll}
          onExportZip={handleExportZip}
          onExportJson={handleExportJson}
        />
      </main>
    </div>
  )
}

export default App
