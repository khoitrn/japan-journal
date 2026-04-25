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
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ ...th, width: '38%' }}>Course Objective</th>
          <th style={th}>How Today's Experiences Connected</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.objectiveKey}>
            <td style={{ ...td, fontWeight: 500, fontSize: 12 }}>
              {row.objectiveLabel}<br />
              <span style={{ color: '#888', fontWeight: 400 }}>(Obj. {row.objectiveKey.replace('obj', '')})</span>
            </td>
            <td style={td}>
              <textarea
                value={row.connection}
                onChange={e => update(i, e.target.value)}
                placeholder='Brief note on connection, or "Not Applicable"'
                rows={2}
                style={{ width: '100%', padding: '4px', border: '1px solid #ddd', borderRadius: 4, resize: 'vertical', fontFamily: 'inherit', fontSize: 12, boxSizing: 'border-box' }}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const th: React.CSSProperties = { padding: '6px 8px', textAlign: 'left', fontWeight: 600, border: '1px solid #ddd', fontSize: 12 }
const td: React.CSSProperties = { padding: '6px 8px', border: '1px solid #eee', verticalAlign: 'top' }
