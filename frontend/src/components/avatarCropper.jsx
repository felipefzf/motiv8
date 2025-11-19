import React, { useState, useRef } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { canvasPreview, getCanvasBlob } from '../utils/canvasPreview'

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function AvatarCropper({ onClose, onCropped }) {
  const [imgSrc, setImgSrc] = useState('')
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [blobToSend, setBlobToSend] = useState(null)

  const imgRef = useRef(null)
  const canvasRef = useRef(null)

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined)
      const reader = new FileReader()
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''))
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget
    const newCrop = centerAspectCrop(width, height, 1)
    setCrop(newCrop)
    setCompletedCrop(newCrop)
  }

  const handleSaveCrop = async () => {
    if (completedCrop && imgRef.current && canvasRef.current) {
      canvasPreview(imgRef.current, canvasRef.current, completedCrop)
      const blob = await getCanvasBlob(canvasRef.current)
      setBlobToSend(blob)
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      setImgSrc('')
    }
  }

  const handleConfirm = () => {
    if (blobToSend && previewUrl) {
      onCropped?.(blobToSend, previewUrl)
      onClose?.()
    }
  }

  return (
    <div>
      <div>
        <input type="file" accept="image/*" onChange={onSelectFile} />
      </div>

      {!!imgSrc && (
        <div>
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            circularCrop
          >
            <img
              ref={imgRef}
              alt="avatar"
              src={imgSrc}
              onLoad={onImageLoad}
            />
          </ReactCrop>
          <button type="button" onClick={handleSaveCrop}>Confirmar Recorte</button>
        </div>
      )}

      {!!previewUrl && !imgSrc && (
        <div>
          <img src={previewUrl} alt="preview" style={{ width: 160, height: 160, borderRadius: '50%' }} />
          <button type="button" onClick={() => setImgSrc(previewUrl)}>Editar</button>
          <button type="button" onClick={handleConfirm}>Guardar</button>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}