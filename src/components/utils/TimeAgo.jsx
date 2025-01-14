'use client'

import ReactTimeAgo from 'react-timeago'

const frenchStrings = {
  prefixAgo: 'il y a',
  prefixFromNow: "d'ici",
  suffixAgo: '',
  suffixFromNow: '',
  seconds: 'moins d\'une minute',
  minute: 'environ une minute',
  minutes: '%d minutes',
  hour: 'environ une heure',
  hours: 'environ %d heures',
  day: 'un jour',
  days: '%d jours',
  month: 'environ un mois',
  months: '%d mois',
  year: 'environ un an',
  years: '%d ans'
}

const formatter = (value, unit, suffix, epochSeconds) => {
  if (unit === 'second') return 'à l\'instant'
  
  const str = frenchStrings[unit]
  if (str) {
    const finalStr = str.replace('%d', value)
    return `${frenchStrings.prefixAgo} ${finalStr}`
  }
  return `${value} ${unit}`
}

export default function TimeAgo({ timestamp, className }) {
  if (!timestamp) return null

  return <span className={className}><ReactTimeAgo date={timestamp} formatter={formatter} /></span>
}
