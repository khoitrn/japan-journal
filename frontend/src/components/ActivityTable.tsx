import type { ActivityRow } from '../types'

const DEFAULT_TYPES = [
  'Business Visit', 'Cultural Activity', 'Group Meal',
  'Transportation Experience', 'Free Exploration', 'Language Practice', 'Other',
]

interface Props {
  rows: ActivityRow[]
  onChange: (rows: ActivityRow[]) => void
}

export default function ActivityTable({ rows, onChange }: Props) {
  const update = (i: number, field: keyof ActivityRow, value: string | boolean) => {
    onChange(rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }
  const addRow = () => onChange([...rows, { type: 'Other', details: '', include: true }])
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i))

  return (
    <div>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table style={{ width: '100%', minWidth: 480, borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#383a4a' }}>
            <th style={th}>Include</th>
            <th style={th}>Activity Type</th>
            <th style={th}>Details</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#282a36' : '#21222c' }}>
              <td style={td}>
                <input type="checkbox" checked={row.include} onChange={e => update(i, 'include', e.target.checked)} />
              </td>
              <td style={td}>
                <select value={row.type} onChange={e => update(i, 'type', e.target.value)} style={inputStyle}>
                  {DEFAULT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </td>
              <td style={td}>
                <input value={row.details} onChange={e => update(i, 'details', e.target.value)}
                  placeholder="Company/location/experience..." style={{ ...inputStyle, width: '100%' }} />
              </td>
              <td style={{ ...td, width: 28 }}>
                <button onClick={() => remove(i)} style={removeBtn}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <button onClick={addRow} style={addBtn}>+ Add activity</button>
    </div>
  )
}

const th: React.CSSProperties = { padding: '6px 8px', textAlign: 'left', fontWeight: 600, border: '1px solid #44475a', fontSize: 12, color: '#bd93f9' }
const td: React.CSSProperties = { padding: '4px 6px', border: '1px solid #44475a', verticalAlign: 'middle' }
const inputStyle: React.CSSProperties = { padding: '4px', border: '1px solid #6272a4', borderRadius: 4, background: '#21222c', color: '#f8f8f2', width: '100%' }
const removeBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#6272a4', cursor: 'pointer', fontSize: 16, padding: 0 }
const addBtn: React.CSSProperties = { marginTop: 8, fontSize: 12, color: '#bd93f9', background: 'none', border: '1px dashed #6272a4', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }
