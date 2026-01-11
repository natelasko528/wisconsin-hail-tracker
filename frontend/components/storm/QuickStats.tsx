'use client'

import { CloudLightning, Home, TrendingUp, AlertTriangle, Target, Users } from 'lucide-react'

interface QuickStatsProps {
  totalEvents: number
  affectedProperties: number
  averageHailSize: number
  severeEvents: number
  leadsGenerated?: number
  conversionRate?: number
  isLoading?: boolean
}

export default function QuickStats({
  totalEvents,
  affectedProperties,
  averageHailSize,
  severeEvents,
  leadsGenerated = 0,
  conversionRate = 0,
  isLoading = false
}: QuickStatsProps) {
  const stats = [
    {
      label: 'Storm Events',
      value: totalEvents,
      icon: CloudLightning,
      color: 'primary',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Properties Affected',
      value: affectedProperties,
      icon: Home,
      color: 'warning',
      format: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString(),
    },
    {
      label: 'Avg Hail Size',
      value: averageHailSize,
      icon: Target,
      color: 'destructive',
      suffix: '"',
      format: (v: number) => v.toFixed(2),
    },
    {
      label: 'Severe Events',
      value: severeEvents,
      icon: AlertTriangle,
      color: 'destructive',
      badge: severeEvents > 0 ? '!' : undefined,
    },
    {
      label: 'Leads Generated',
      value: leadsGenerated,
      icon: Users,
      color: 'success',
    },
    {
      label: 'Conversion Rate',
      value: conversionRate,
      icon: TrendingUp,
      color: 'accent',
      suffix: '%',
      format: (v: number) => v.toFixed(1),
    },
  ]

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      primary: 'text-primary bg-primary-muted',
      warning: 'text-warning bg-warning-muted',
      destructive: 'text-destructive bg-destructive-muted',
      success: 'text-success bg-success-muted',
      accent: 'text-accent bg-accent-muted',
    }
    return colors[color] || colors.primary
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="stat-card stat-card-glow animate-pulse">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-muted" />
              <div className="w-12 h-4 rounded bg-muted" />
            </div>
            <div className="w-20 h-7 rounded bg-muted mb-1" />
            <div className="w-16 h-3 rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        const displayValue = stat.format 
          ? stat.format(stat.value) 
          : stat.value.toLocaleString()
        
        return (
          <div 
            key={stat.label}
            className="stat-card stat-card-glow animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${getColorClass(stat.color)}`}>
                <Icon className="w-4 h-4" />
              </div>
              {stat.trend && (
                <div className={`
                  text-xs font-medium flex items-center gap-0.5
                  ${stat.trendUp ? 'text-success' : 'text-destructive'}
                `}>
                  <TrendingUp className={`w-3 h-3 ${!stat.trendUp && 'rotate-180'}`} />
                  {stat.trend}
                </div>
              )}
              {stat.badge && (
                <div className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs font-bold animate-pulse">
                  {stat.badge}
                </div>
              )}
            </div>
            
            <div className="data-value mb-1">
              {displayValue}
              {stat.suffix && (
                <span className="text-base text-foreground-muted ml-0.5">
                  {stat.suffix}
                </span>
              )}
            </div>
            
            <div className="data-label">{stat.label}</div>
          </div>
        )
      })}
    </div>
  )
}
