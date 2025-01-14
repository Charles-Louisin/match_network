'use client'

import { useState, useEffect } from 'react'

export default function TimeAgo({ timestamp, className }) {
  const [timeAgo, setTimeAgo] = useState('')

  useEffect(() => {
    if (!timestamp) return;

    function getTimeAgo() {
      const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000)

      let interval = seconds / 31536000 // années
      if (interval > 1) {
        return Math.floor(interval) + ' an' + (Math.floor(interval) > 1 ? 's' : '')
      }

      interval = seconds / 2592000 // mois
      if (interval > 1) {
        return Math.floor(interval) + ' mois'
      }

      interval = seconds / 86400 // jours
      if (interval > 1) {
        return Math.floor(interval) + ' jour' + (Math.floor(interval) > 1 ? 's' : '')
      }

      interval = seconds / 3600 // heures
      if (interval > 1) {
        return Math.floor(interval) + ' heure' + (Math.floor(interval) > 1 ? 's' : '')
      }

      interval = seconds / 60 // minutes
      if (interval > 1) {
        return Math.floor(interval) + ' minute' + (Math.floor(interval) > 1 ? 's' : '')
      }

      return 'à l\'instant'
    }

    const updateTimeAgo = () => {
      setTimeAgo(getTimeAgo())
    }

    updateTimeAgo()
    const timer = setInterval(updateTimeAgo, 60000) // Met à jour toutes les minutes

    return () => clearInterval(timer)
  }, [timestamp])

  if (!timestamp) return null

  return <span className={className}>il y a {timeAgo}</span>
}
