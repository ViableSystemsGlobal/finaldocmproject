import { useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogHeader,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import * as XLSX from 'xlsx'

interface ImportExportButtonsProps {
  onExport: () => void
  onImport: (file: File) => Promise<void>
  entityName: string
}

export default function ImportExportButtons({ 
  onExport, 
  onImport,
  entityName
}: ImportExportButtonsProps) {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to import')
      return
    }

    try {
      setIsImporting(true)
      setError(null)
      await onImport(file)
      setIsImportDialogOpen(false)
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import file')
    } finally {
      setIsImporting(false)
    }
  }

  const generateTemplate = () => {
    let templateData: any[] = []
    let columns: string[] = []
    
    if (entityName.toLowerCase() === 'contacts') {
      // Sample data for contacts template with ALL current form fields
      templateData = [
        {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          lifecycle: 'soul',
          date_of_birth: '1990-01-15',
          location: 'Denver, CO',
          occupation: 'Software Engineer'
        },
        {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+9876543210',
          lifecycle: 'member',
          date_of_birth: '1985-06-20',
          location: 'Aurora, CO',
          occupation: 'Teacher'
        }
      ]
      columns = ['first_name', 'last_name', 'email', 'phone', 'lifecycle', 'date_of_birth', 'location', 'occupation']
    } else if (entityName.toLowerCase() === 'members') {
      // Sample data for members template
      templateData = [
        {
          contact_id: 'uuid_of_contact',
          joined_at: '2023-01-15',
          notes: 'Sample note for member'
        }
      ]
      columns = ['contact_id', 'joined_at', 'notes']
    }
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(templateData)
    
    // Add headers
    XLSX.utils.sheet_add_aoa(worksheet, [columns], { origin: 'A1' })
    
    // Add to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, entityName)
    
    // Generate and download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${entityName.toLowerCase()}_template.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex space-x-2">
      <Button 
        variant="outline" 
        onClick={() => setIsImportDialogOpen(true)}
        className="flex items-center gap-1"
      >
        <Upload className="h-4 w-4 mr-1" />
        Import
      </Button>
      
      <Button 
        variant="outline" 
        onClick={onExport}
        className="flex items-center gap-1"
      >
        <Download className="h-4 w-4 mr-1" />
        Export
      </Button>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import {entityName}</DialogTitle>
            <DialogDescription>
              Upload a spreadsheet file containing {entityName.toLowerCase()} data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <p className="text-sm text-muted-foreground">
                Supported formats: Excel (.xlsx, .xls) or CSV
              </p>
            </div>
            
            {entityName.toLowerCase() === 'contacts' && (
              <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">📋 Template Info:</p>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-disc">
                  <li><strong>Required:</strong> first_name, last_name, email</li>
                  <li><strong>Optional:</strong> phone, date_of_birth, location, occupation</li>
                  <li><strong>Lifecycle values:</strong> soul, contact, visitor, member, inactive (default: soul)</li>
                  <li><strong>Date format:</strong> YYYY-MM-DD (e.g., 1990-01-15)</li>
                  <li><strong>Alt column names:</strong> firstName, lastName, dateOfBirth, dob, city, address, job, profession</li>
                </ul>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={generateTemplate}
                size="sm"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download Template
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsImportDialogOpen(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleImport}
              disabled={!file || isImporting}
            >
              {isImporting ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 