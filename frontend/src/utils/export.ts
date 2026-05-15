import type { DayEntry } from '../types'

async function toEmbeddedDataUrl(url: string): Promise<string> {
  if (!url || url.startsWith('data:')) return url
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return url
  }
}

export async function printDay(entry: DayEntry, name?: string): Promise<void> {
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

  // Pre-fetch all photos as embedded data URLs before building HTML.
  // This makes the document fully self-contained with zero network deps.
  const photoUrls = await Promise.all(
    sections.photos.filter(p => p.url).map(p => toEmbeddedDataUrl(p.url))
  )
  const photos = sections.photos
    .filter(p => p.url)
    .map((p, i) => `<div class="photo-item"><img src="${photoUrls[i]}" /><p>${p.caption}</p></div>`)
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Daily Travel Journal — Day ${entry.day}</title>
<style>
  /* No external font imports — fully self-contained so load fires reliably */
  body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; margin: 1in; color: #000; }
  h1 { font-family: Arial, Helvetica, sans-serif; font-size: 14pt; text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; }
  h2 { font-family: Arial, Helvetica, sans-serif; font-size: 12pt; background: #f0f0f0; padding: 4px 8px; margin-top: 20px; page-break-after: avoid; break-after: avoid; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; page-break-inside: avoid; break-inside: avoid; }
  th { background: #ddd; text-align: left; padding: 4px 8px; border: 1px solid #999; font-size: 10pt; }
  td { padding: 4px 8px; border: 1px solid #ccc; font-size: 10pt; vertical-align: top; }
  p { line-height: 1.6; }
  .meta { text-align: center; font-size: 10pt; color: #555; margin-bottom: 16px; }
  .student-name { text-align: center; font-size: 11pt; font-weight: bold; margin: 4px 0 8px; }
  .photos-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 10px; }
  .photo-item { page-break-inside: avoid; break-inside: avoid; }
  .photo-item img { width: 100%; max-height: 220px; object-fit: cover; border: 1px solid #ccc; display: block; }
  .photo-item p { font-size: 9pt; margin: 4px 0 0; }
  @media print { body { margin: 0.75in; } }
</style>
</head>
<body>
<h1>DAILY TRAVEL JOURNAL — DAY ${entry.day}</h1>
${name ? `<div class="student-name">${name}</div>` : ''}
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
<div class="photos-grid">${photos || '<p>No photos uploaded.</p>'}</div>

<h2>9. TOMORROW'S ANTICIPATION</h2>
<p>${sections.tomorrowsAnticipation}</p>
</body>
</html>`

  // Use a Blob URL so the window loads like a normal page.
  // This gives us a reliable load event that fires only after all
  // inline base64 images are fully decoded and the page is ready to print.
  const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
  const blobUrl = URL.createObjectURL(blob)
  const win = window.open(blobUrl, '_blank')
  if (!win) { URL.revokeObjectURL(blobUrl); return }

  win.addEventListener('load', () => {
    win.focus()
    win.print()
    URL.revokeObjectURL(blobUrl)
  }, { once: true })
}
