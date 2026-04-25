import type { DayEntry } from '../types'

export function printDay(entry: DayEntry): void {
  const sections = entry.sections
  if (!sections) return

  const activities = sections.activities
    .filter(a => a.include)
    .map(a => `<tr><td>${a.type}</td><td>${a.details}</td></tr>`)
    .join('')

  const language = sections.languageApplications
    .filter(l => l.include)
    .map(l => `<tr><td>${l.skill}</td><td>${l.context}</td></tr>`)
    .join('')

  const objectives = sections.objectiveConnections
    .map(o => `<tr><td>${o.objectiveLabel} (Obj. ${o.objectiveKey.replace('obj', '')})</td><td>${o.connection}</td></tr>`)
    .join('')

  const photos = sections.photos
    .filter(p => p.url)
    .map(p => `<div class="photo-item"><img src="${p.url}" /><p>${p.caption}</p></div>`)
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Daily Travel Journal — Day ${entry.day}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11pt; margin: 1in; color: #000; }
  h1 { font-size: 14pt; text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; }
  h2 { font-size: 12pt; background: #f0f0f0; padding: 4px 8px; margin-top: 20px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #ddd; text-align: left; padding: 4px 8px; border: 1px solid #999; font-size: 10pt; }
  td { padding: 4px 8px; border: 1px solid #ccc; font-size: 10pt; vertical-align: top; }
  p { line-height: 1.6; }
  .meta { text-align: center; font-size: 10pt; color: #555; margin-bottom: 16px; }
  .photo-item { display: inline-block; width: 45%; margin: 8px; vertical-align: top; }
  .photo-item img { width: 100%; border: 1px solid #ccc; }
  .photo-item p { font-size: 9pt; margin: 4px 0; }
  @media print { body { margin: 0.75in; } }
</style>
</head>
<body>
<h1>DAILY TRAVEL JOURNAL — DAY ${entry.day}</h1>
<div class="meta">Date: ${entry.date} &nbsp;|&nbsp; Location: ${entry.city}</div>

<h2>1. ACTIVITIES LOG</h2>
<table>
  <tr><th>Activity Type</th><th>Details</th></tr>
  ${activities || '<tr><td colspan="2">—</td></tr>'}
</table>

<h2>2. TECHNOLOGY &amp; BUSINESS INSIGHTS</h2>
<p>${sections.techInsights}</p>

<h2>3. CULTURAL OBSERVATIONS</h2>
<p>${sections.culturalObservations}</p>

<h2>4. LANGUAGE APPLICATION</h2>
<table>
  <tr><th>Language Skill</th><th>Context Where You Applied It</th></tr>
  ${language || '<tr><td colspan="2">—</td></tr>'}
</table>

<h2>5. CONNECTIONS TO COURSE OBJECTIVES</h2>
<table>
  <tr><th>Course Objective</th><th>How Today's Experiences Connected</th></tr>
  ${objectives}
</table>

<h2>6. POSITIVE REFLECTIONS</h2>
<p>${sections.positiveReflections}</p>

<h2>7. QUESTIONS &amp; CURIOSITIES</h2>
<p>${sections.questionsCuriosities}</p>

<h2>8. VISUAL DOCUMENTATION</h2>
<div>${photos || '<p>No photos uploaded.</p>'}</div>

<h2>9. TOMORROW'S ANTICIPATION</h2>
<p>${sections.tomorrowsAnticipation}</p>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}
