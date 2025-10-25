'use client'

import { useState } from 'react'

export default function SimpleUpload() {
  const [files, setFiles] = useState<File[]>([])
  const [collectionName, setCollectionName] = useState('')
  const [collectionCategory, setCollectionCategory] = useState('Sunday Service')
  const [collectionDate, setCollectionDate] = useState('')
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState<string[]>([])

  const categories = [
    'Sunday Service', 'Youth Ministry', 'Prayer Meeting', 'Bible Study',
    'Community Outreach', 'Special Events', 'Baptisms', 'Fellowship',
    'Worship Night', 'Missions', 'Kids Ministry', 'Mens Ministry', 'Womens Ministry'
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleUpload = async () => {
    if (!files.length || !collectionName) {
      setResults(['Please select files and enter collection name'])
      return
    }

    setUploading(true)
    setResults([])
    const uploadResults: string[] = []

    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('altText', '')
        formData.append('collectionName', collectionName)
        formData.append('collectionCategory', collectionCategory)
        formData.append('collectionDate', collectionDate)

        const response = await fetch('/api/upload-media', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (response.ok && result.success) {
          uploadResults.push(`✅ ${file.name} uploaded successfully`)
        } else {
          uploadResults.push(`❌ ${file.name} failed: ${result.error || 'Unknown error'}`)
        }
      } catch (error) {
        uploadResults.push(`❌ ${file.name} failed: ${error}`)
      }
    }

    setResults(uploadResults)
    setUploading(false)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Simple Media Upload</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Collection Name:</label>
        <input
          type="text"
          value={collectionName}
          onChange={(e) => setCollectionName(e.target.value)}
          placeholder="e.g., Sunday Service December 2024"
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Service/Program:</label>
        <select
          value={collectionCategory}
          onChange={(e) => setCollectionCategory(e.target.value)}
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Date (optional):</label>
        <input
          type="date"
          value={collectionDate}
          onChange={(e) => setCollectionDate(e.target.value)}
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Select Files:</label>
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileChange}
          style={{ width: '100%', padding: '8px' }}
        />
        {files.length > 0 && (
          <p style={{ marginTop: '5px', color: '#666' }}>
            Selected: {files.length} files
          </p>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={uploading || !files.length || !collectionName}
        style={{
          backgroundColor: uploading ? '#ccc' : '#007bff',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '4px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {uploading ? 'Uploading...' : 'Upload Collection'}
      </button>

      {results.length > 0 && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <h3>Upload Results:</h3>
          {results.map((result, index) => (
            <div key={index} style={{ margin: '5px 0' }}>
              {result}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 