import { useRef } from 'react'
import type { Photo } from '../types'

interface Props {
  photos: Photo[]
  onChange: (photos: Photo[]) => void
}

export default function PhotoUpload({ photos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const remaining = 5 - photos.length
    Array.from(files).slice(0, remaining).forEach(file => {
      const reader = new FileReader()
      reader.onload = e => {
        const url = e.target?.result as string
        onChange([...photos, { url, caption: '' }])
      }
      reader.readAsDataURL(file)
    })
  }

  const updateCaption = (i: number, caption: string) => {
    onChange(photos.map((p, idx) => idx === i ? { ...p, caption } : p))
  }

  const remove = (i: number) => onChange(photos.filter((_, idx) => idx !== i))

  return (
    <div>
      <p style={{ fontSize: 12, color: '#6272a4', margin: '0 0 10px' }}>
        Upload 3–5 photos. Add a brief caption explaining why you chose each.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
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
          <button onClick={() => inputRef.current?.click()} style={{ width: 160, height: 160, border: '2px dashed #6272a4', borderRadius: 6, background: 'none', cursor: 'pointer', color: '#6272a4', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span style={{ fontSize: 28 }}>📷</span>
            <span>Add photo</span>
            <span style={{ fontSize: 11 }}>{photos.length}/5</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
    </div>
  )
}
