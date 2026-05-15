import { useRef, useState, useCallback } from 'react'
import heic2any from 'heic2any'
import type { Photo } from '../types'
import { uploadPhoto, deletePhoto } from '../utils/api'

interface Props {
  photos: Photo[]
  onChange: (photos: Photo[]) => void
  isAdmin: boolean
  dayNum: number
}

const MAX_DIM = 1600

async function canvasConvert(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      let w = img.naturalWidth, h = img.naturalHeight
      if (w > MAX_DIM || h > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / w, MAX_DIM / h)
        w = Math.round(w * ratio)
        h = Math.round(h * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('canvas toBlob failed')); return }
        resolve(new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.82)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('canvas decode failed')) }
    img.src = url
  })
}

async function toResizedFile(file: File): Promise<File> {
  const name = file.name.toLowerCase()
  const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || name.endsWith('.heic') || name.endsWith('.heif')
  if (isHeic) {
    try {
      return await canvasConvert(file)
    } catch {
      const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })
      const blob = Array.isArray(result) ? result[0] : result
      return await canvasConvert(new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
    }
  }
  return canvasConvert(file)
}

export default function PhotoUpload({ photos, onChange, isAdmin, dayNum }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [converting, setConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const processFiles = useCallback(async (files: File[]) => {
    const remaining = 5 - photos.length
    const batch = files
      .filter(f => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name))
      .slice(0, remaining)
    if (!batch.length) return
    setConverting(true)
    setError(null)
    const results: Photo[] = []
    let failed = 0

    for (const file of batch) {
      try {
        const resized = await toResizedFile(file)
        if (isAdmin) {
          // Upload to R2 — get back a permanent URL
          const { id, url } = await uploadPhoto(dayNum, resized)
          results.push({ id, url, caption: '' })
        } else {
          // Guest: store as base64 in localStorage
          const url = await new Promise<string>((res, rej) => {
            const reader = new FileReader()
            reader.onload = e => res(e.target?.result as string)
            reader.onerror = rej
            reader.readAsDataURL(resized)
          })
          results.push({ url, caption: '' })
        }
      } catch (err) {
        failed++
        console.error(err)
      }
    }

    if (results.length) onChange([...photos, ...results])
    if (failed) setError(`${failed} photo${failed > 1 ? 's' : ''} couldn't be uploaded — try again.`)
    setConverting(false)
  }, [photos, onChange, isAdmin, dayNum])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    const files = Array.from(e.clipboardData.files)
    if (files.length) processFiles(files)
  }, [processFiles])

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    processFiles(Array.from(e.dataTransfer.files))
  }

  const remove = async (i: number) => {
    const photo = photos[i]
    if (isAdmin && photo.id) {
      try { await deletePhoto(photo.id) } catch { /* ignore — already removed from UI */ }
    }
    onChange(photos.filter((_, idx) => idx !== i))
  }

  const updateCaption = (i: number, caption: string) =>
    onChange(photos.map((p, idx) => idx === i ? { ...p, caption } : p))

  return (
    <div
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
    >
      <p style={{ fontSize: 12, color: '#6272a4', margin: '0 0 10px' }}>
        Upload 3–5 photos. HEIC converted automatically. You can also <strong>paste</strong> or <strong>drag &amp; drop</strong>.
        {isAdmin && <span style={{ color: '#50fa7b' }}> Photos upload directly to cloud storage.</span>}
      </p>
      {error && (
        <div style={{ background: '#ff555522', border: '1px solid #ff5555', borderRadius: 6, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#ff5555', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12, border: dragging ? '2px dashed #bd93f9' : '2px solid transparent', borderRadius: 8, padding: dragging ? 8 : 0, transition: 'all 0.15s' }}>
        {photos.map((photo, i) => (
          <div key={photo.id ?? i} style={{ width: 160, background: '#44475a', border: '1px solid #6272a4', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ position: 'relative' }}>
              <img src={photo.url} alt="" style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
              <button onClick={() => remove(i)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#f8f8f2', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 12, lineHeight: '20px', textAlign: 'center', padding: 0 }}>×</button>
            </div>
            <textarea
              value={photo.caption}
              onChange={e => updateCaption(i, e.target.value)}
              placeholder="Why this photo?"
              rows={2}
              style={{ width: '100%', border: 'none', borderTop: '1px solid #6272a4', padding: '6px', fontSize: 11, resize: 'none', fontFamily: 'inherit', background: '#383a4a', color: '#f8f8f2', boxSizing: 'border-box' }}
            />
          </div>
        ))}
        {photos.length < 5 && (
          <button
            onClick={() => !converting && inputRef.current?.click()}
            disabled={converting}
            style={{ width: 160, height: 160, border: '2px dashed #6272a4', borderRadius: 6, background: 'none', cursor: converting ? 'wait' : 'pointer', color: '#6272a4', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: converting ? 0.6 : 1 }}
          >
            <span style={{ fontSize: 28 }}>{converting ? '⏳' : '📷'}</span>
            <span>{converting ? 'Uploading…' : 'Add photo'}</span>
            <span style={{ fontSize: 11 }}>{photos.length}/5</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*,.heic,.heif" multiple style={{ display: 'none' }} onChange={handleInputChange} />
    </div>
  )
}
