import { format, isToday, isYesterday, formatDistanceToNow, parseISO } from 'date-fns'

export function formatTimestamp(dateStr: string): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return formatDistanceToNow(date, { addSuffix: true })
  if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`
  return format(date, 'MMM d, yyyy')
}

export function formatFullDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMMM d, yyyy · h:mm a')
}

export function getDateGroup(dateStr: string): 'today' | 'yesterday' | 'older' {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'today'
  if (isYesterday(date)) return 'yesterday'
  return 'older'
}

export function formatDateGroupLabel(group: 'today' | 'yesterday' | 'older'): string {
  const map = { today: 'Today', yesterday: 'Yesterday', older: 'Older' }
  return map[group]
}
