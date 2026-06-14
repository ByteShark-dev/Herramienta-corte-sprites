import type { LoadedSpriteSheetImage } from '../types/models'

export const loadImageFile = (file: File): Promise<LoadedSpriteSheetImage> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      resolve({
        element: image,
        fileName: file.name,
        objectUrl,
        width: image.naturalWidth,
        height: image.naturalHeight,
      })
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('The selected file could not be decoded as an image.'))
    }

    image.src = objectUrl
  })
