import type { LanguageRow } from '../types'

const DEFAULT_SKILLS = [
  'Used greetings',
  'Navigated transportation',
  'Ordered food',
  'Asked/answered questions',
  'Read signs/directions',
  'Other language use',
]

interface Props {
  rows: LanguageRow[]
  onChange: (rows: LanguageRow[]) => void
}

export default function LanguageTable({ rows, onChange }: Props) {
  const update = (i: number, field: keyof LanguageRow, value: string | boolean) => {
    onChange(rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  const addRow = () => onChange([...rows, { skill: 'Other language use', context: '', include: true }])
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i))

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={th}>Include</th>
            <th style={th}>Language Skill</th>
            <th style={th}>Context Where You Applied It</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td style={td}>
                <input type="checkbox" checked={row.include} onChange={e => update(i, 'include', e.target.checked)} />
              </td>
              <td style={td}>
                <select
                  value={row.skill}
                  onChange={e => update(i, 'skill', e.target.value)}
                  style={{ width: '100%', padding: '4px', border: '1px solid #ddd', borderRadius: 4 }}
                >
                  {DEFAULT_SKILLS.map(s => <option key={s}>{s}</option>)}
                </select>
              </td>
              <td style={td}>
                <input
                  value={row.context}
                  onChange={e => update(i, 'context', e.target.value)}
                  placeholder="Where/how you used it..."
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
      <button onClick={addRow} style={addBtn}>+ Add language moment</button>
    </div>
  )
}

const th: React.CSSProperties = { padding: '6px 8px', textAlign: 'left', fontWeight: 600, border: '1px solid #ddd', fontSize: 12 }
const td: React.CSSProperties = { padding: '4px 6px', border: '1px solid #eee', verticalAlign: 'middle' }
const removeBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 16, padding: 0 }
const addBtn: React.CSSProperties = { marginTop: 8, fontSize: 12, color: '#075E54', background: 'none', border: '1px dashed #075E54', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }
