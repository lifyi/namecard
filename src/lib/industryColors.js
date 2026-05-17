export const INDUSTRY_COLORS = {
  'Shipping':         '#4a7fa5',
  'Legal':            '#7a5fa5',
  'Finance':          '#4a9a6a',
  'Government':       '#6a4aa5',
  'Port Authority':   '#a57a4a',
  'Technology':       '#4a8a8a',
  'Insurance':        '#a54a6a',
  'Trade Association':'#7a8a4a',
  'Academic':         '#a5904a',
  'Other':            '#6a6a6a',
}

export function industryColor(industry) {
  return INDUSTRY_COLORS[industry] || INDUSTRY_COLORS['Other']
}

// hex → rgba string
export function hex2rgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
