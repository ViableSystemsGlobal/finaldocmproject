'use client'

import { useState } from 'react'
import { 
  Settings, 
  Building, 
  Heart, 
  MessageSquare, 
  FormInput, 
  Shield, 
  Zap,
  Navigation,
  Link as LinkIcon,
  Users,
  ChevronRight,
  Sparkles,
  Database,
  Bell,
  Mail,
  CreditCard,
  FileText,
  ArrowUpRight
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const settingsModules = [
  {
    id: 'tenant',
    title: 'Church Profile',
    description: 'Church information, branding, and general settings',
    icon: Building,
    href: '/settings/tenant',
    color: 'from-blue-500 to-indigo-600',
    status: 'ready',
    category: 'Core'
  },
  {
    id: 'campuses',
    title: 'Campus Management',
    description: 'Manage multiple campus locations and their details',
    icon: Building,
    href: '/settings/campuses',
    color: 'from-green-500 to-emerald-600',
    status: 'ready',
    category: 'Core'
  },
  {
    id: 'custom-fields',
    title: 'Custom Fields',
    description: 'Create dynamic form fields for members, visitors, and events',
    icon: FormInput,
    href: '/settings/custom-fields',
    color: 'from-purple-500 to-violet-600',
    status: 'ready',
    category: 'Core'
  },
  {
    id: 'roles',
    title: 'User Roles & Permissions',
    description: 'Manage staff roles and access control permissions',
    icon: Shield,
    href: '/settings/roles',
    color: 'from-amber-500 to-orange-600',
    status: 'ready',
    category: 'Security'
  },
  {
    id: 'integrations',
    title: 'Integration Settings',
    description: 'Connect payment gateways, email services, and third-party tools',
    icon: Zap,
    href: '/settings/integrations',
    color: 'from-indigo-500 to-purple-600',
    status: 'ready',
    category: 'Integrations'
  },
  {
    id: 'giving-categories',
    title: 'Giving Categories',
    description: 'Manage donation categories and giving options',
    icon: Heart,
    href: '/settings/giving-categories',
    color: 'from-pink-500 to-rose-600',
    status: 'ready',
    category: 'Finance'
  },
  {
    id: 'payment-categories',
    title: 'Payment Categories',
    description: 'Manage payment methods and transaction settings',
    icon: CreditCard,
    href: '/settings/payment-categories',
    color: 'from-blue-500 to-indigo-600',
    status: 'ready',
    category: 'Finance'
  },
  {
    id: 'comms-defaults',
    title: 'Communication Templates',
    description: 'Default email and SMS templates for automated messages',
    icon: MessageSquare,
    href: '/settings/comms-defaults',
    color: 'from-teal-500 to-cyan-600',
    status: 'ready',
    category: 'Communications'
  },
  {
    id: 'communications',
    title: 'Communication Settings',
    description: 'Configure SMS, email, WhatsApp and push notification providers',
    icon: Settings,
    href: '/settings/communications',
    color: 'from-blue-500 to-indigo-600',
    status: 'ready',
    category: 'Communications'
  },
  {
    id: 'email-system',
    title: 'Email System Settings',
    description: 'Configure email system, test mode, and production settings',
    icon: Mail,
    href: '/settings/email-system',
    color: 'from-purple-500 to-indigo-600',
    status: 'ready',
    category: 'Communications'
  },
  {
    id: 'workflows',
    title: 'Workflow Automation',
    description: 'Automated processes and follow-up sequences',
    icon: Sparkles,
    href: '/settings/workflows',
    color: 'from-violet-500 to-purple-600',
    status: 'ready',
    category: 'Automation'
  },
  {
    id: 'navigation',
    title: 'Website Navigation',
    description: 'Manage public website menu and navigation structure',
    icon: Navigation,
    href: '/settings/navigation',
    color: 'from-slate-500 to-gray-600',
    status: 'ready',
    category: 'Website'
  },
  {
    id: 'footer',
    title: 'Footer Management',
    description: 'Configure website footer blocks and content',
    icon: LinkIcon,
    href: '/settings/footer',
    color: 'from-gray-500 to-slate-600',
    status: 'ready',
    category: 'Website'
  },
  {
    id: 'word-of-year',
    title: 'Word of the Year',
    description: 'Set your annual spiritual theme displayed on the homepage',
    icon: Sparkles,
    href: '/settings/word-of-year',
    color: 'from-yellow-400 via-orange-500 to-pink-500',
    status: 'ready',
    category: 'Website'
  },
  {
    id: 'audit-logs',
    title: 'Audit Logs',
    description: 'View system activity and security audit trails',
    icon: FileText,
    href: '/settings/audit-logs',
    color: 'from-red-500 to-pink-600',
    status: 'ready',
    category: 'Security'
  },
  {
    id: 'notifications',
    title: 'Notification Settings',
    description: 'Configure system notifications and alerts',
    icon: Bell,
    href: '/settings/notifications',
    color: 'from-yellow-500 to-amber-600',
    status: 'ready',
    category: 'Communications'
  }
]

const categories = [
  { id: 'core', name: 'Core', icon: Settings },
  { id: 'security', name: 'Security', icon: Shield },
  { id: 'communications', name: 'Communications', icon: Mail },
  { id: 'finance', name: 'Finance', icon: CreditCard },
  { id: 'integrations', name: 'Integrations', icon: Zap },
  { id: 'automation', name: 'Automation', icon: Sparkles },
  { id: 'website', name: 'Website', icon: Navigation },
]

export default function SettingsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredModules = selectedCategory === 'all' 
    ? settingsModules 
    : settingsModules.filter(module => module.category.toLowerCase() === selectedCategory.toLowerCase())

  const readyCount = settingsModules.filter(m => m.status === 'ready').length
  const totalCount = settingsModules.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6">
              <Settings className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Settings
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Configure your church management system with powerful settings and integrations
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center space-x-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{readyCount}</div>
              <div className="text-slate-300">Ready to Use</div>
            </div>
            <div className="w-px h-12 bg-slate-500"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{totalCount}</div>
              <div className="text-slate-300">Total Modules</div>
            </div>
            <div className="w-px h-12 bg-slate-500"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">7</div>
              <div className="text-slate-300">Categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-3">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            className={selectedCategory === 'all' ? 'bg-slate-800 hover:bg-slate-900' : 'bg-white/80 hover:bg-white'}
          >
            All Modules
          </Button>
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category.id)}
                className={`${
                  selectedCategory === category.id 
                    ? 'bg-slate-800 hover:bg-slate-900' 
                    : 'bg-white/80 hover:bg-white'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {category.name}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Settings Modules */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredModules.map((module) => {
            const Icon = module.icon
            const isComingSoon = module.status === 'coming-soon'
            
            return (
              <Card 
                key={module.id} 
                className={`group border-0 shadow-lg bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl ${
                  isComingSoon 
                    ? 'opacity-75 cursor-not-allowed' 
                    : 'hover:scale-105 cursor-pointer'
                }`}
              >
                {isComingSoon ? (
                  <div className="p-6">
                    <CardHeader className="p-0 mb-4">
                      <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} opacity-50`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                            Coming Soon
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-xl text-slate-700">{module.title}</CardTitle>
                      <CardDescription className="text-slate-500">
                        {module.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs bg-slate-50 text-slate-500">
                        {module.category}
                      </Badge>
                      <div className="text-slate-400">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link href={module.href} className="block p-6 h-full">
                    <CardHeader className="p-0 mb-4">
                      <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Ready
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-xl text-slate-900 group-hover:text-slate-700 transition-colors">
                        {module.title}
                      </CardTitle>
                      <CardDescription className="text-slate-600 group-hover:text-slate-500 transition-colors">
                        {module.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {module.category}
                      </Badge>
                      <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                )}
              </Card>
            )
          })}
        </div>

        {filteredModules.length === 0 && (
          <div className="text-center py-16">
            <div className="text-slate-400 text-lg">No modules found in this category</div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:shadow-xl transition-all duration-300 cursor-pointer">
              <Link href="/settings/tenant" className="block p-6">
                <div className="flex items-center space-x-3">
                  <Building className="w-8 h-8" />
                  <div>
                    <div className="font-semibold">Setup Church Info</div>
                    <div className="text-blue-100 text-sm">Basic church details</div>
                  </div>
                </div>
              </Link>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white hover:shadow-xl transition-all duration-300 cursor-pointer">
              <Link href="/settings/roles" className="block p-6">
                <div className="flex items-center space-x-3">
                  <Shield className="w-8 h-8" />
                  <div>
                    <div className="font-semibold">Manage Roles</div>
                    <div className="text-amber-100 text-sm">Staff permissions</div>
                  </div>
                </div>
              </Link>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:shadow-xl transition-all duration-300 cursor-pointer">
              <Link href="/settings/integrations" className="block p-6">
                <div className="flex items-center space-x-3">
                  <Zap className="w-8 h-8" />
                  <div>
                    <div className="font-semibold">Add Integrations</div>
                    <div className="text-indigo-100 text-sm">Connect services</div>
                  </div>
                </div>
              </Link>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white hover:shadow-xl transition-all duration-300 cursor-pointer">
              <Link href="/settings/custom-fields" className="block p-6">
                <div className="flex items-center space-x-3">
                  <FormInput className="w-8 h-8" />
                  <div>
                    <div className="font-semibold">Custom Fields</div>
                    <div className="text-purple-100 text-sm">Dynamic forms</div>
                  </div>
                </div>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 