export const INDUSTRY_COLORS = {
  'Shipping':          '#2e6a96',
  'Legal':             '#6a4a96',
  'Finance':           '#2a7a50',
  'Government':        '#4a2a96',
  'Port Authority':    '#8a5a20',
  'Technology':        '#2a6a6a',
  'Insurance':         '#8a2a50',
  'Trade Association': '#5a6a20',
  'Academic':          '#8a6a20',
  'Other':             '#5a5a5a',
}

export function industryColor(industry) {
  return INDUSTRY_COLORS[industry] || INDUSTRY_COLORS['Other']
}

export function hex2rgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
