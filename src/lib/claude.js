export async function extractCardData(frontImageBase64, backImageBase64 = null) {
  const images = [{ data: frontImageBase64, mediaType: 'image/jpeg' }]
  if (backImageBase64) {
    images.push({ data: backImageBase64, mediaType: 'image/jpeg' })
  }

  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images, type: 'extract' }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error: ${err}`)
  }

  const { result } = await res.json()
  return result
}

export async function structureNotes(rawNotes) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: rawNotes, type: 'structure_notes' }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error: ${err}`)
  }

  const { result } = await res.json()
  return result
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
