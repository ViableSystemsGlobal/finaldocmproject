import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, template_id, subject, preheader } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required for preview' }, { status: 400 })
    }

    let htmlContent = content
    
    // If template_id is provided, fetch the template and merge content
    if (template_id) {
      const { data: template, error: templateError } = await supabaseAdmin
        .from('newsletter_templates')
        .select('html_content')
        .eq('id', template_id)
        .single()

      if (templateError) {
        console.error('Error fetching template:', templateError)
        return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
      }

      // Replace {{content}} placeholder with actual content
      htmlContent = template.html_content.replace(/\{\{content\}\}/g, content)
      
      // Replace other placeholders
      htmlContent = htmlContent.replace(/\{\{subject\}\}/g, subject || 'Newsletter Subject')
      htmlContent = htmlContent.replace(/\{\{preheader\}\}/g, preheader || '')
    } else {
      // Create a basic HTML wrapper if no template
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${subject || 'Newsletter Preview'}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            h1 { color: #2c3e50; }
            h2 { color: #34495e; }
            .preheader { font-size: 14px; color: #7f8c8d; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          ${preheader ? `<div class="preheader">${preheader}</div>` : ''}
          <h1>${subject || 'Newsletter'}</h1>
          <div>${content}</div>
        </body>
        </html>
      `
    }

    return NextResponse.json({ 
      html_content: htmlContent,
      preview_url: null // Could implement a temporary preview URL if needed
    })
  } catch (error) {
    console.error('Preview API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 