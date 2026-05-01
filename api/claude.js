const EXTRACTION_PROMPT = `You are extracting contact information from business card images. Return ONLY valid JSON with these fields: name, alternate_name, title, company, email, phone, alternate_messenger, address, industry, relationship_type, geography, tags (array of 2-4 strings). For industry choose from: Shipping, Legal, Finance, Government, Port Authority, Technology, Insurance, Trade Association, Academic, Other. For relationship_type: Client, Counterparty, Regulator, Industry peer, Vendor/supplier, Advisor/counsel, Internal colleague, Investor, Media, Other. For geography: Singapore, China, Europe, Middle East, South Asia, Southeast Asia, Americas, Africa, Global. Infer categorisation from company name, title, and address. If uncertain, use Other. Return null for any field you cannot determine.`

const NOTES_PROMPT = `You are structuring raw contact notes into a clean format. Return ONLY valid JSON with these fields: where_met (string), discussion (string), personal_notes (string), follow_up_action (string or null). Extract location and event context for where_met. Summarise what was discussed for discussion. Any personal details about the person go in personal_notes. Any action items or follow-up intentions go in follow_up_action. Be concise. Do not invent details not present in the notes.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
  }

  const { images, prompt, type } = req.body

  if (!type || !['extract', 'structure_notes'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type. Must be extract or structure_notes.' })
  }

  try {
    let requestBody

    if (type === 'extract') {
      if (!images || images.length === 0) {
        return res.status(400).json({ error: 'images required for extraction' })
      }

      const content = images.map((img) => ({
        type: 'image',
        source: {
          type: 'base64',
          media_type: img.mediaType || 'image/jpeg',
          data: img.data,
        },
      }))

      content.push({ type: 'text', text: EXTRACTION_PROMPT })

      requestBody = {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content }],
      }
    } else {
      if (!prompt) {
        return res.status(400).json({ error: 'prompt required for notes structuring' })
      }

      requestBody = {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `${NOTES_PROMPT}\n\nRaw notes:\n${prompt}`,
          },
        ],
      }
    }

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    })

    if (!claudeRes.ok) {
      const errText = await claudeRes.text()
      console.error('Claude API error:', errText)
      return res.status(claudeRes.status).json({ error: 'Claude API error', detail: errText })
    }

    const claudeData = await claudeRes.json()
    const text = claudeData.content?.[0]?.text || ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return res.status(422).json({ error: 'Could not parse JSON from Claude response', raw: text })
    }

    const result = JSON.parse(jsonMatch[0])
    return res.status(200).json({ result })
  } catch (err) {
    console.error('Handler error:', err)
    return res.status(500).json({ error: err.message })
  }
}
