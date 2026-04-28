import type { ObjectiveConnection } from '../types'

interface Props {
  rows: ObjectiveConnection[]
  onChange: (rows: ObjectiveConnection[]) => void
}

export default function ObjectivesTable({ rows, onChange }: Props) {
  const update = (i: number, connection: string) => {
    onChange(rows.map((r, idx) => idx === i ? { ...r, connection } : r))
  }

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
    <table style={{ width: '100%', minWidth: 400, borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ background: '#383a4a' }}>
          <th style={{ ...th, width: '38%' }}>Course Objective</th>
          <th style={th}>How Today's Experiences Connected</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.objectiveKey} style={{ background: i % 2 === 0 ? '#282a36' : '#21222c' }}>
            <td style={{ ...td, fontSize: 12 }}>
              <span style={{ color: '#bd93f9', fontWeight: 600 }}>{row.objectiveLabel}</span><br />
              <span style={{ color: '#6272a4' }}>Obj. {row.objectiveKey.replace('obj', '')}</span>
            </td>
            <td style={td}>
              <textarea
                value={row.connection}
                onChange={e => update(i, e.target.value)}
                placeholder='Brief note, or "Not Applicable"'
                rows={2}
                style={{ width: '100%', padding: '4px', border: '1px solid #6272a4', borderRadius: 4, resize: 'vertical', fontFamily: 'inherit', fontSize: 12, background: '#21222c', color: '#f8f8f2', boxSizing: 'border-box' }}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  )
}

const th: React.CSSProperties = { padding: '6px 8px', textAlign: 'left', fontWeight: 600, border: '1px solid #44475a', fontSize: 12, color: '#bd93f9' }
const td: React.CSSProperties = { padding: '6px 8px', border: '1px solid #44475a', verticalAlign: 'top' }
