// Static mock data — no backend required
export const MOCK_CONTACTS = [
  {
    id: '1',
    created_at: '2025-05-14T08:00:00Z',
    date_met: '2025-05-14',
    name: 'Li Chen',
    alternate_name: '陈力',
    title: 'Managing Director',
    company: 'Evergreen Marine',
    email: 'li.chen@evergreen-marine.com',
    phone: '+65 9123 4567',
    alternate_messenger: 'WeChat: lchen_evergreen',
    address: '438 Alexandra Road, #08-00, Singapore 119958',
    where_met: 'CommuniCAsia 2025, Singapore',
    industry: 'Shipping',
    relationship_type: 'Client',
    geography: 'China',
    how_met: 'Conference',
    tags: ['container-shipping', 'taiwan', 'fleet-ops'],
    follow_up_flag: true,
    card_front_url: null,
    card_back_url: null,
    notes_raw: null,
    notes_structured: null,
    interactions: [
      {
        id: 'i1a',
        date: '2025-05-14',
        discussion: 'Discussed Q3 charter rates and long-term capacity agreement interest.',
        follow_up: 'Send draft term sheet.',
        raw_note: 'met li chen at communiasia booth 14B. he was v interested in Q3 rates esp for transpacific. mentioned evergreen looking for long term capacity deals. follow up with term sheet asap',
      },
      {
        id: 'i1b',
        date: '2025-05-21',
        discussion: 'Follow-up call on term sheet. He reviewed draft and has questions on the demurrage clause.',
        follow_up: 'Revise clause 8 and resend.',
        raw_note: 'called li chen re term sheet. he had read it, generally ok but stuck on clause 8 demurrage cap. said it was too low vs market. need to revise and resend before end of week',
      },
      {
        id: 'i1c',
        date: '2025-05-28',
        discussion: 'Confirmed revised terms acceptable. Moving to execution.',
        follow_up: null,
        raw_note: 'li chen called back. said clause 8 revision looks good. agreed to move to execution. legal teams to connect directly from here. no further action needed from my side for now',
      },
    ],
  },
  {
    id: '2',
    created_at: '2025-05-12T19:00:00Z',
    date_met: '2025-05-12',
    name: 'Raj Kumar',
    alternate_name: null,
    title: 'Partner',
    company: 'Linklaters LLP',
    email: 'raj.kumar@linklaters.com',
    phone: '+65 9234 5678',
    alternate_messenger: null,
    address: 'One George Street, #17-01, Singapore 049145',
    where_met: 'SCMA Annual Dinner',
    industry: 'Legal',
    relationship_type: 'Advisor/counsel',
    geography: 'Singapore',
    how_met: 'Event',
    tags: ['disputes', 'arbitration'],
    follow_up_flag: false,
    card_front_url: null,
    card_back_url: null,
    notes_raw: null,
    notes_structured: null,
    interactions: [
      {
        id: 'i2a',
        date: '2025-05-12',
        discussion: 'Met at SCMA dinner. Raj heads maritime arbitration practice. Discussed recent London arbitration trends and Singapore as a seat.',
        follow_up: 'Share latest SCMA rule amendments.',
        raw_note: 'raj kumar linklaters. sat next to him at dinner. maritime arb partner. talked about london vs singapore as arb seat, thinks singapore gaining ground esp for asia-pac disputes. said he can advise if we need arb counsel. share scma rule update',
      },
    ],
  },
  {
    id: '3',
    created_at: '2025-05-10T10:00:00Z',
    date_met: '2025-05-10',
    name: 'Sarah Wong',
    alternate_name: null,
    title: 'VP Finance',
    company: 'DBS Bank',
    email: 'sarah.wong@dbs.com',
    phone: '+65 9345 6789',
    alternate_messenger: null,
    address: '12 Marina Boulevard, DBS Asia Central, Singapore 018982',
    where_met: 'MAS Fintech Festival',
    industry: 'Finance',
    relationship_type: 'Industry peer',
    geography: 'Singapore',
    how_met: 'Conference',
    tags: ['trade-finance', 'sustainability'],
    follow_up_flag: false,
    card_front_url: null,
    card_back_url: null,
    notes_raw: null,
    notes_structured: null,
    interactions: [
      {
        id: 'i3a',
        date: '2025-05-10',
        discussion: 'Met at Fintech Festival panel on trade finance digitisation. Sarah leads DBS sustainable trade finance product.',
        follow_up: 'Intro to their green shipping finance desk.',
        raw_note: 'sarah wong DBS at fintech festival. was on the panel. leads sustainable trade finance. very knowledgeable on green shipping. mentioned DBS has a specific green shipping finance desk. asked for intro',
      },
      {
        id: 'i3b',
        date: '2025-05-19',
        discussion: 'Coffee catch-up. Walked through DBS green shipping facility terms. Looks promising for our next vessel order.',
        follow_up: null,
        raw_note: 'coffee with sarah at mbfc. she walked me through green shipping facility. 30bp discount if vessel meets green index threshold. will raise internally for next newbuild order',
      },
    ],
  },
  {
    id: '4',
    created_at: '2025-05-08T09:00:00Z',
    date_met: '2025-05-08',
    name: 'Mohammed Hassan',
    alternate_name: null,
    title: 'Director',
    company: 'Port of Singapore Authority',
    email: 'm.hassan@mpa.gov.sg',
    phone: '+65 9456 7890',
    alternate_messenger: null,
    address: '460 Alexandra Road, PSA Building, Singapore 119963',
    where_met: 'Singapore Maritime Week',
    industry: 'Port Authority',
    relationship_type: 'Regulator',
    geography: 'Singapore',
    how_met: 'Conference',
    tags: ['port-ops', 'compliance'],
    follow_up_flag: false,
    card_front_url: null,
    card_back_url: null,
    notes_raw: null,
    notes_structured: null,
    interactions: [
      {
        id: 'i4a',
        date: '2025-05-08',
        discussion: 'Brief introduction at SMW reception. Mohammed oversees port operations compliance. Discussed upcoming MPA circular on vessel reporting.',
        follow_up: null,
        raw_note: 'met mohammed hassan MPA at smw drinks. director port ops compliance. mentioned new reporting circular coming q3. brief chat, need to follow up properly through formal channel if needed',
      },
    ],
  },
  {
    id: '5',
    created_at: '2025-05-05T14:00:00Z',
    date_met: '2025-05-05',
    name: 'Yuki Tanaka',
    alternate_name: '田中ゆき',
    title: 'General Counsel',
    company: 'Mitsui & Co',
    email: 'y.tanaka@mitsui.com',
    phone: '+81 3 1234 5678',
    alternate_messenger: null,
    address: '2-1 Ohtemachi 1-chome, Chiyoda-ku, Tokyo 100-8631',
    where_met: 'WSC Annual Meeting, Washington DC',
    industry: 'Shipping',
    relationship_type: 'Industry peer',
    geography: 'Singapore',
    how_met: 'Conference',
    tags: ['japan', 'bulk-cargo', 'gc-network'],
    follow_up_flag: false,
    card_front_url: null,
    card_back_url: null,
    notes_raw: null,
    notes_structured: null,
    interactions: [
      {
        id: 'i5a',
        date: '2025-05-05',
        discussion: 'Met at WSC annual meeting dinner. Yuki is GC for Mitsui shipping division. Discussed decarbonisation regulatory pressure and ammonia fuel pilot.',
        follow_up: 'Connect on ammonia bunkering working group.',
        raw_note: 'yuki tanaka mitsui GC at wsc dinner washington. focused on bulk cargo and decarbonisation. mitsui running ammonia pilot in 2026. she chairs their internal fuel transition working group. said she\'d welcome connecting on the industry working group',
      },
      {
        id: 'i5b',
        date: '2025-05-16',
        discussion: 'Email exchange re ammonia working group. She forwarded WG terms of reference. Will join next call.',
        follow_up: null,
        raw_note: 'yuki followed up by email with ammonia wg TOR. agreed to join their next call in june. she cc\'d their sustainability lead',
      },
    ],
  },
  {
    id: '6',
    created_at: '2025-05-03T11:00:00Z',
    date_met: '2025-05-03',
    name: 'Arjun Patel',
    alternate_name: null,
    title: 'CEO',
    company: 'TradeVault Technologies',
    email: 'arjun@tradevault.io',
    phone: '+65 9678 0123',
    alternate_messenger: null,
    address: '1 Fusionopolis Way, #08-10, Singapore 138632',
    where_met: 'TOC Asia 2025',
    industry: 'Technology',
    relationship_type: 'Vendor/supplier',
    geography: 'Singapore',
    how_met: 'Conference',
    tags: ['blockchain', 'trade-docs'],
    follow_up_flag: false,
    card_front_url: null,
    card_back_url: null,
    notes_raw: null,
    notes_structured: null,
    interactions: [
      {
        id: 'i6a',
        date: '2025-05-03',
        discussion: 'Demo of TradeVault digital bill of lading platform at TOC Asia. Impressive UX. Discussed integration with our ops system.',
        follow_up: 'Request sandbox access for tech team evaluation.',
        raw_note: 'arjun patel tradevault at toc asia. showed demo of their eBL platform. looks good, much cleaner than essdocs. asked about api integration with our ops. follow up to get sandbox for tech team',
      },
    ],
  },
]

// In-memory store — mutations persist for the session
let contacts = MOCK_CONTACTS.map(c => ({ ...c, interactions: [...c.interactions] }))

export function getMockContacts({ search, industry, relationship_type, geography, sort } = {}) {
  let result = [...contacts]

  if (search) {
    const q = search.toLowerCase()
    result = result.filter(c =>
      [c.name, c.company, c.title, ...(c.tags || [])].some(f => f?.toLowerCase().includes(q))
    )
  }
  if (industry) result = result.filter(c => c.industry === industry)
  if (relationship_type) result = result.filter(c => c.relationship_type === relationship_type)
  if (geography) result = result.filter(c => c.geography === geography)

  const lastSeen = (c) => {
    if (!c.interactions?.length) return c.date_met || ''
    return [...c.interactions].sort((a, b) => b.date.localeCompare(a.date))[0].date
  }

  if (sort === 'last_seen') {
    result.sort((a, b) => lastSeen(b).localeCompare(lastSeen(a)))
  } else {
    result.sort((a, b) => (b.date_met || '').localeCompare(a.date_met || ''))
  }

  return result
}

export function getMockContact(id) {
  return contacts.find(c => c.id === id) || null
}

export function saveMockContact(contact) {
  const idx = contacts.findIndex(c => c.id === contact.id)
  if (idx >= 0) {
    contacts[idx] = { ...contacts[idx], ...contact }
    return contacts[idx]
  } else {
    const newContact = { interactions: [], ...contact, id: contact.id || String(Date.now()) }
    contacts.unshift(newContact)
    return newContact
  }
}

export function toggleMockFollowUp(id) {
  const c = contacts.find(c => c.id === id)
  if (c) c.follow_up_flag = !c.follow_up_flag
  return c
}

export function deleteMockContact(id) {
  contacts = contacts.filter(c => c.id !== id)
}

export function addMockInteraction(contactId, interaction) {
  const c = contacts.find(c => c.id === contactId)
  if (c) {
    const entry = { id: `i${Date.now()}`, ...interaction }
    c.interactions = [...(c.interactions || []), entry]
    // re-sort interactions by date
    c.interactions.sort((a, b) => a.date.localeCompare(b.date))
    return entry
  }
  return null
}

export function updateMockInteraction(contactId, interactionId, updates) {
  const c = contacts.find(c => c.id === contactId)
  if (c) {
    const idx = c.interactions.findIndex(i => i.id === interactionId)
    if (idx >= 0) c.interactions[idx] = { ...c.interactions[idx], ...updates }
  }
}

// Compute summary stats from interactions
export function getContactStats(contact) {
  const interactions = contact.interactions || []
  if (!interactions.length) {
    return { firstMet: contact.date_met, lastSeen: contact.date_met, count: 0, daysSince: null }
  }
  const sorted = [...interactions].sort((a, b) => a.date.localeCompare(b.date))
  const firstMet = sorted[0].date
  const lastSeen = sorted[sorted.length - 1].date
  const today = new Date()
  const lastDate = new Date(lastSeen)
  const daysSince = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24))
  return { firstMet, lastSeen, count: interactions.length, daysSince }
}
