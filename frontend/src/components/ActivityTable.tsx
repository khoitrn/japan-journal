import type { ActivityRow } from '../types'

const DEFAULT_TYPES = [
  'Business Visit',
  'Cultural Activity',
  'Group Meal',
  'Transportation Experience',
  'Free Exploration',
  'Language Practice',
  'Other',
]

interface Props {
  rows: ActivityRow[]
  onChange: (rows: ActivityRow[]) => void
}

export default function ActivityTable({ rows, onChange }: Props) {
  const update = (i: number, field: keyof ActivityRow, value: string | boolean) => {
    const next = rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r)
    onChange(next)
  }

  const addRow = () => onChange([...rows, { type: 'Other', details: '', include: true }])
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i))

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={th}>Include</th>
            <th style={th}>Activity Type</th>
            <th style={th}>Details</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td style={td}>
                <input
                  type="checkbox"
                  checked={row.include}
                  onChange={e => update(i, 'include', e.target.checked)}
                />
              </td>
              <td style={td}>
                <select
                  value={row.type}
                  onChange={e => update(i, 'type', e.target.value)}
                  style={{ width: '100%', padding: '4px', border: '1px solid #ddd', borderRadius: 4 }}
                >
                  {DEFAULT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </td>
              <td style={td}>
                <input
                  value={row.details}
                  onChange={e => update(i, 'details', e.target.value)}
                  placeholder="Company/location/experience..."
                  style={{ width: '100%', padding: '4px', border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' }}
                />
              </td>
              <td style={{ ...td, width: 28 }}>
                <button onClick={() => remove(i)} style={removeBtn} title="Remove">×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addRow} style={addBtn}>+ Add activity</button>
    </div>
  )
}

const th: React.CSSProperties = { padding: '6px 8px', textAlign: 'left', fontWeight: 600, border: '1px solid #ddd', fontSize: 12 }
const td: React.CSSProperties = { padding: '4px 6px', border: '1px solid #eee', verticalAlign: 'middle' }
const removeBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 16, padding: 0 }
const addBtn: React.CSSProperties = { marginTop: 8, fontSize: 12, color: '#075E54', background: 'none', border: '1px dashed #075E54', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }
