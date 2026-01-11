'use client'

import { useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { 
  FileText,
  Download,
  Calendar,
  CloudLightning,
  Home,
  Users,
  TrendingUp,
  DollarSign,
  BarChart3,
  PieChart,
  Filter,
  Mail,
  Printer,
  Share,
  Plus,
  Clock,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react'
import { format, subDays } from 'date-fns'

interface ReportTemplate {
  id: string
  name: string
  description: string
  icon: React.ElementType
  category: 'storm' | 'lead' | 'financial' | 'marketing'
  generatedAt?: string
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'hail-damage-assessment',
    name: 'Hail Damage Assessment',
    description: 'Professional report documenting storm damage for insurance claims',
    icon: CloudLightning,
    category: 'storm',
  },
  {
    id: 'property-estimate',
    name: 'Property Repair Estimate',
    description: 'Detailed repair cost estimate for homeowner presentation',
    icon: Home,
    category: 'storm',
  },
  {
    id: 'storm-summary',
    name: 'Storm Summary Report',
    description: 'Overview of storm events within a date range',
    icon: BarChart3,
    category: 'storm',
  },
  {
    id: 'lead-pipeline',
    name: 'Lead Pipeline Report',
    description: 'Current status of all leads across pipeline stages',
    icon: Users,
    category: 'lead',
  },
  {
    id: 'conversion-analysis',
    name: 'Conversion Analysis',
    description: 'Analyze lead conversion rates and performance',
    icon: TrendingUp,
    category: 'lead',
  },
  {
    id: 'revenue-forecast',
    name: 'Revenue Forecast',
    description: 'Projected revenue from active pipeline',
    icon: DollarSign,
    category: 'financial',
  },
  {
    id: 'campaign-performance',
    name: 'Campaign Performance',
    description: 'Email and SMS campaign effectiveness report',
    icon: Mail,
    category: 'marketing',
  },
]

const RECENT_REPORTS = [
  {
    id: '1',
    name: 'Hail Damage Assessment - 123 Main St',
    type: 'Hail Damage Assessment',
    generatedAt: subDays(new Date(), 1).toISOString(),
    size: '2.4 MB',
  },
  {
    id: '2',
    name: 'Weekly Storm Summary - Jan 2026',
    type: 'Storm Summary Report',
    generatedAt: subDays(new Date(), 3).toISOString(),
    size: '1.1 MB',
  },
  {
    id: '3',
    name: 'Lead Pipeline Report - Q1 2026',
    type: 'Lead Pipeline Report',
    generatedAt: subDays(new Date(), 5).toISOString(),
    size: '856 KB',
  },
]

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'storm' | 'lead' | 'financial' | 'marketing'>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const filteredTemplates = selectedCategory === 'all'
    ? REPORT_TEMPLATES
    : REPORT_TEMPLATES.filter(t => t.category === selectedCategory)

  const handleGenerateReport = async () => {
    if (!selectedTemplate) return
    setIsGenerating(true)
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsGenerating(false)
    setSelectedTemplate(null)
    alert('Report generated successfully!')
  }

  const getCategoryColor = (category: ReportTemplate['category']) => {
    switch (category) {
      case 'storm': return 'text-destructive bg-destructive-muted'
      case 'lead': return 'text-primary bg-primary-muted'
      case 'financial': return 'text-success bg-success-muted'
      case 'marketing': return 'text-warning bg-warning-muted'
      default: return 'text-foreground-muted bg-muted'
    }
  }

  return (
    <AppLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-border bg-background-secondary/50 backdrop-blur">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-4">
              <h1 className="font-display text-lg font-bold text-foreground">
                Reports
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="btn btn-primary btn-sm">
                <Plus className="w-4 h-4" />
                Create Report
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Report Templates */}
              <div className="lg:col-span-2">
                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display font-semibold text-foreground">
                      Report Templates
                    </h2>
                    <div className="flex items-center gap-1 bg-background-secondary rounded-lg p-1">
                      {['all', 'storm', 'lead', 'financial', 'marketing'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat as typeof selectedCategory)}
                          className={`
                            px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize
                            ${selectedCategory === cat
                              ? 'bg-primary text-primary-foreground'
                              : 'text-foreground-muted hover:text-foreground'
                            }
                          `}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTemplates.map((template) => {
                      const Icon = template.icon
                      return (
                        <button
                          key={template.id}
                          onClick={() => setSelectedTemplate(template)}
                          className={`
                            p-4 rounded-lg border text-left transition-all
                            hover:border-primary hover:shadow-glow
                            ${selectedTemplate?.id === template.id
                              ? 'border-primary bg-primary-muted/20'
                              : 'border-border bg-card'
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(template.category)}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground mb-1">
                                {template.name}
                              </div>
                              <p className="text-sm text-foreground-muted line-clamp-2">
                                {template.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Generate Button */}
                  {selectedTemplate && (
                    <div className="mt-6 pt-6 border-t border-border animate-fade-in">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-foreground">
                            Generate: {selectedTemplate.name}
                          </h3>
                          <p className="text-sm text-foreground-muted">
                            Configure options and generate your report
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedTemplate(null)}
                            className="btn btn-ghost btn-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleGenerateReport}
                            disabled={isGenerating}
                            className="btn btn-primary btn-sm"
                          >
                            {isGenerating ? (
                              <>
                                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <FileText className="w-4 h-4" />
                                Generate Report
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="card">
                  <h3 className="font-display font-semibold text-foreground mb-4">
                    This Month
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground-muted">Reports Generated</span>
                      <span className="font-mono font-bold text-foreground">12</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground-muted">Most Popular</span>
                      <span className="text-sm font-medium text-foreground">Hail Assessment</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground-muted">Total Downloads</span>
                      <span className="font-mono font-bold text-foreground">34</span>
                    </div>
                  </div>
                </div>

                {/* Recent Reports */}
                <div className="card">
                  <h3 className="font-display font-semibold text-foreground mb-4">
                    Recent Reports
                  </h3>
                  <div className="space-y-3">
                    {RECENT_REPORTS.map((report) => (
                      <div
                        key={report.id}
                        className="p-3 bg-muted rounded-lg hover:bg-card-hover transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <FileSpreadsheet className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-foreground truncate">
                              {report.name}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-foreground-subtle">
                              <Clock className="w-3 h-3" />
                              {format(new Date(report.generatedAt), 'MMM d, h:mm a')}
                              <span className="text-foreground-subtle">•</span>
                              {report.size}
                            </div>
                          </div>
                          <button className="btn btn-ghost btn-icon btn-sm flex-shrink-0">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="card">
                  <h3 className="font-display font-semibold text-foreground mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <button className="w-full btn btn-outline justify-start">
                      <Printer className="w-4 h-4" />
                      Print Current View
                    </button>
                    <button className="w-full btn btn-outline justify-start">
                      <Share className="w-4 h-4" />
                      Share Report
                    </button>
                    <button className="w-full btn btn-outline justify-start">
                      <Calendar className="w-4 h-4" />
                      Schedule Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
