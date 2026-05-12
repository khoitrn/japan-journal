import { useRef, useState, useCallback } from 'react'
import heic2any from 'heic2any'
import type { Photo } from '../types'

interface Props {
  photos: Photo[]
  onChange: (photos: Photo[]) => void
}

async function canvasConvert(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('canvas decode failed')) }
    img.src = url
  })
}

async function toJpegDataUrl(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || name.endsWith('.heic') || name.endsWith('.heif')
  if (isHeic) {
    // Try native canvas first (works in Safari on macOS/iOS), fall back to heic2any for Chrome
    try {
      return await canvasConvert(file)
    } catch {
      const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })
      const blob = Array.isArray(result) ? result[0] : result
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => resolve(e.target?.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    }
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function PhotoUpload({ photos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [converting, setConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const processFiles = useCallback(async (files: File[]) => {
    const remaining = 5 - photos.length
    const batch = files.filter(f => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name)).slice(0, remaining)
    if (!batch.length) return
    setConverting(true)
    setError(null)
    try {
      const results: Photo[] = []
      for (const file of batch) {
        const url = await toJpegDataUrl(file)
        results.push({ url, caption: '' })
      }
      onChange([...photos, ...results])
    } catch (err) {
      setError('Could not convert photo. Try exporting as JPEG from Photos first.')
      console.error(err)
    } finally {
      setConverting(false)
    }
  }, [photos, onChange])

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
    const files = Array.from(e.dataTransfer.files)
    if (files.length) processFiles(files)
  }

  const updateCaption = (i: number, caption: string) => {
    onChange(photos.map((p, idx) => idx === i ? { ...p, caption } : p))
  }

  const remove = (i: number) => onChange(photos.filter((_, idx) => idx !== i))

  return (
    <div
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
    >
      <p style={{ fontSize: 12, color: '#6272a4', margin: '0 0 10px' }}>
        Upload 3–5 photos. Add a brief caption explaining why you chose each. HEIC converted automatically. You can also <strong>paste</strong> or <strong>drag &amp; drop</strong>.
      </p>
      {error && (
        <div style={{ background: '#ff555522', border: '1px solid #ff5555', borderRadius: 6, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#ff5555' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12, border: dragging ? '2px dashed #bd93f9' : '2px solid transparent', borderRadius: 8, padding: dragging ? 8 : 0, transition: 'all 0.15s' }}>
        {photos.map((photo, i) => (
          <div key={i} style={{ width: 160, background: '#44475a', border: '1px solid #6272a4', borderRadius: 6, overflow: 'hidden' }}>
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
            <span>{converting ? 'Converting…' : 'Add photo'}</span>
            <span style={{ fontSize: 11 }}>{photos.length}/5</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*,.heic,.heif" multiple style={{ display: 'none' }} onChange={handleInputChange} />
    </div>
  )
}
