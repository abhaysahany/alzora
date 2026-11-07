export { useTetherStream as useAventraContracts, useTetherStream } from './useTetherStream'

export function formatDateToIST(val) {
  if (!val) return 'Confirmed On-Chain'
  let dateObj = null

  if (typeof val === 'number' && val > 0) {
    dateObj = new Date(val < 1e11 ? val * 1000 : val)
  } else if (typeof val === 'string' && val.trim()) {
    const trimmed = val.trim()
    if (!isNaN(trimmed)) {
      const num = Number(trimmed)
      dateObj = new Date(num < 1e11 ? num * 1000 : num)
    } else {
      let str = trimmed
      if (/^\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}/.test(str) && !str.includes('Z') && !str.includes('+') && !str.includes('IST') && !str.includes('AM') && !str.includes('PM')) {
        str = str.replace(' ', 'T') + 'Z'
      }
      dateObj = new Date(str)
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return typeof val === 'string' ? val : 'Confirmed On-Chain'
  }

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).formatToParts(dateObj)

    const get = (type) => parts.find((p) => p.type === type)?.value || ''
    return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')} ${get('dayPeriod')?.toUpperCase()}`.trim()
  } catch {
    return typeof val === 'string' ? val : 'Confirmed On-Chain'
  }
}
