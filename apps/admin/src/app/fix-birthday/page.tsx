"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, Cake } from 'lucide-react'

export default function FixBirthdayPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fixBirthdayColumn = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/fix-birthday-column', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to fix birthday column')
      }

    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cake className="h-6 w-6 text-pink-500" />
            Fix Birthday Column
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-slate-600">
              This will add the missing <code className="bg-slate-100 px-2 py-1 rounded">date_of_birth</code> column 
              to the contacts table so the birthday functionality on the dashboard works properly.
            </p>
            
            <Button 
              onClick={fixBirthdayColumn}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fixing Birthday Column...
                </>
              ) : (
                <>
                  <Cake className="h-4 w-4 mr-2" />
                  Fix Birthday Column
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-red-700 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-green-700 font-medium">Success!</p>
                  <p className="text-green-600 text-sm">{result.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Column Status</p>
                  <Badge variant={result.columnExists ? "default" : "secondary"}>
                    {result.columnExists ? 'Already Existed' : 'Newly Added'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Contacts with Birthdays</p>
                  <Badge variant="outline">
                    {result.contactsWithBirthdays} contacts
                  </Badge>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-700 font-medium mb-2">🎂 Next Steps:</p>
                <ul className="text-blue-600 text-sm space-y-1">
                  <li>• Add birthday dates to your contacts in the People section</li>
                  <li>• The dashboard will show upcoming birthdays within the next 7 days</li>
                  <li>• You can also set up automated birthday email workflows</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 