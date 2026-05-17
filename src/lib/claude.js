// Mock implementation — no Claude API calls
export async function extractCardData() {
  await delay(1200)
  return {
    name: 'Demo Contact',
    alternate_name: null,
    title: 'Director',
    company: 'Demo Corp',
    email: 'demo@democorp.com',
    phone: '+65 9000 0000',
    alternate_messenger: null,
    address: '1 Demo Street, Singapore',
    industry: 'Shipping',
    relationship_type: 'Client',
    geography: 'Singapore',
    tags: ['demo', 'mock'],
  }
}

export async function structureNotes(rawNotes) {
  await delay(1000)
  return {
    where_met: 'Demo event',
    discussion: rawNotes.length > 80 ? rawNotes.slice(0, 80) + '…' : rawNotes,
    personal_notes: null,
    follow_up_action: null,
  }
}

export function fileToBase64() {
  return Promise.resolve('')
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}
