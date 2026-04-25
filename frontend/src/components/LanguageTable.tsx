import type { LanguageRow } from '../types'

const DEFAULT_SKILLS = [
  'Used greetings', 'Navigated transportation', 'Ordered food',
  'Asked/answered questions', 'Read signs/directions', 'Other language use',
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
          <tr style={{ background: '#383a4a' }}>
            <th style={th}>Include</th>
            <th style={th}>Language Skill</th>
            <th style={th}>Context Where You Applied It</th>
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
                <select value={row.skill} onChange={e => update(i, 'skill', e.target.value)} style={inputStyle}>
                  {DEFAULT_SKILLS.map(s => <option key={s}>{s}</option>)}
                </select>
              </td>
              <td style={td}>
                <input value={row.context} onChange={e => update(i, 'context', e.target.value)}
                  placeholder="Where/how you used it..." style={{ ...inputStyle, width: '100%' }} />
              </td>
              <td style={{ ...td, width: 28 }}>
                <button onClick={() => remove(i)} style={removeBtn}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addRow} style={addBtn}>+ Add language moment</button>
    </div>
  )
}

const th: React.CSSProperties = { padding: '6px 8px', textAlign: 'left', fontWeight: 600, border: '1px solid #44475a', fontSize: 12, color: '#bd93f9' }
const td: React.CSSProperties = { padding: '4px 6px', border: '1px solid #44475a', verticalAlign: 'middle' }
const inputStyle: React.CSSProperties = { padding: '4px', border: '1px solid #6272a4', borderRadius: 4, background: '#21222c', color: '#f8f8f2', width: '100%' }
const removeBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#6272a4', cursor: 'pointer', fontSize: 16, padding: 0 }
const addBtn: React.CSSProperties = { marginTop: 8, fontSize: 12, color: '#bd93f9', background: 'none', border: '1px dashed #6272a4', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }
