"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  DollarSign, Receipt, CreditCard, Building, TrendingUp, Activity, 
  ChevronRight, PieChart, LineChart, Target, Sparkles, Zap, Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"

const financeCategories = [
  {
    id: 'giving',
    title: 'Giving Management',
    description: 'Track donations, pledges, and giving patterns',
    icon: DollarSign,
    href: '/finance/giving',
    gradient: 'from-emerald-500 to-emerald-600',
    stats: [
      { label: 'YTD Giving', value: '$142,000' },
      { label: 'Monthly Avg', value: '$11,833' },
      { label: 'Regular Givers', value: '289' }
    ]
  },
  {
    id: 'expenses',
    title: 'Expense Tracking',
    description: 'Monitor church expenses and operational costs',
    icon: CreditCard,
    href: '/finance/expenses',
    gradient: 'from-red-500 to-pink-500',
    stats: [
      { label: 'Monthly Expenses', value: '$8,450' },
      { label: 'Budget Remaining', value: '$12,550' },
      { label: 'Categories', value: '12' }
    ]
  },
  {
    id: 'assets',
    title: 'Asset Management',
    description: 'Manage church assets and inventory',
    icon: Building,
    href: '/finance/assets',
    gradient: 'from-blue-500 to-blue-600',
    stats: [
      { label: 'Total Assets', value: '$458,000' },
      { label: 'Equipment', value: '156 items' },
      { label: 'Facilities', value: '4 locations' }
    ]
  },
  {
    id: 'dashboard',
    title: 'Financial Dashboard',
    description: 'Comprehensive financial overview and analytics',
    icon: PieChart,
    href: '/finance/dashboard',
    gradient: 'from-purple-500 to-purple-600',
    stats: [
      { label: 'Net Position', value: '+$8,350' },
      { label: 'Growth Rate', value: '+12.4%' },
      { label: 'Budget Status', value: 'On Track' }
    ]
  }
]

const quickInsights = [
  {
    title: 'Monthly Giving',
    value: '$11,833',
    change: '+8.2%',
    trend: 'up',
    period: 'vs last month',
    icon: DollarSign,
    color: 'text-emerald-600'
  },
  {
    title: 'Expenses',
    value: '$8,450',
    change: '-3.1%',
    trend: 'down',
    period: 'vs last month',
    icon: CreditCard,
    color: 'text-red-600'
  },
  {
    title: 'Net Income',
    value: '+$3,383',
    change: '+24.8%',
    trend: 'up',
    period: 'this month',
    icon: TrendingUp,
    color: 'text-blue-600'
  },
  {
    title: 'Budget Health',
    value: '87%',
    change: '+2.1%',
    trend: 'up',
    period: 'on track',
    icon: Target,
    color: 'text-purple-600'
  }
]

export default function FinancePage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Finance</h2>
          <p className="text-slate-600">Preparing financial data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl blur-sm opacity-75"></div>
              <div className="relative bg-gradient-to-r from-emerald-500 to-green-500 p-4 rounded-2xl">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Financial Management
              </h1>
              <p className="text-xl text-slate-600 mt-2">
                Comprehensive stewardship and financial oversight
              </p>
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-2 rounded-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Financial Overview</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickInsights.map((insight, index) => (
              <div key={index} className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-slate-100 ${insight.color}`}>
                    <insight.icon className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-600">{insight.title}</p>
                    <p className="text-2xl font-bold text-slate-800">{insight.value}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${insight.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {insight.change}
                  </span>
                  <span className="text-slate-500 text-sm">{insight.period}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Finance Categories */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-2 rounded-lg">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Financial Tools</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {financeCategories.map((category) => (
              <div 
                key={category.id} 
                className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300 group"
              >
                {/* Header */}
                <div className={`bg-gradient-to-r ${category.gradient} px-8 py-6`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 p-3 rounded-xl">
                        <category.icon className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{category.title}</h3>
                        <p className="text-white/80">{category.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-6 w-6 text-white/60 group-hover:text-white transition-colors" />
                  </div>
                </div>

                {/* Stats */}
                <div className="p-8">
                  <div className="grid grid-cols-3 gap-6 mb-6">
                    {category.stats.map((stat, index) => (
                      <div key={index} className="text-center">
                        <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                        <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <Button 
                    asChild 
                    className="w-full bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white border-0 shadow-lg h-12 rounded-xl font-semibold"
                  >
                    <Link href={category.href}>
                      View {category.title}
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions & Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Quick Actions */}
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Quick Actions</h3>
                  <p className="text-slate-300">Common financial tasks</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="space-y-4">
                <Link 
                  href="/finance/giving/new"
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 border border-emerald-200 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-2 rounded-lg">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold text-slate-800 group-hover:text-emerald-600">Record Donation</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-600" />
                </Link>

                <Link 
                  href="/finance/expenses/new"
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 border border-red-200 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-red-500 to-pink-500 p-2 rounded-lg">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold text-slate-800 group-hover:text-red-600">Add Expense</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-red-600" />
                </Link>

                <Link 
                  href="/finance/assets/new"
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-lg">
                      <Building className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold text-slate-800 group-hover:text-blue-600">Add Asset</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600" />
                </Link>
              </div>
            </div>
          </div>

          {/* Financial Calendar */}
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Financial Calendar</h3>
                  <p className="text-white/80">Upcoming deadlines</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="font-semibold text-slate-800">Monthly Report Due</p>
                    <p className="text-sm text-slate-600">Financial summary for board</p>
                  </div>
                  <span className="text-sm font-medium text-amber-600">3 days</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="font-semibold text-slate-800">Payroll Processing</p>
                    <p className="text-sm text-slate-600">Staff and contractor payments</p>
                  </div>
                  <span className="text-sm font-medium text-blue-600">1 week</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="font-semibold text-slate-800">Budget Review</p>
                    <p className="text-sm text-slate-600">Quarterly budget assessment</p>
                  </div>
                  <span className="text-sm font-medium text-purple-600">2 weeks</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 