import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, contactId, eventId } = body

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Workflow type is required' },
        { status: 400 }
      )
    }

    // Trigger the workflow execution engine
    const workflowResponse = await fetch(
      'https://ufjfafcfkalaasdhgcbi.supabase.co/functions/v1/execute-workflows',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          trigger: {
            type,
            contactId,
            eventId
          }
        }),
      }
    )

    const workflowResult = await workflowResponse.json()

    if (!workflowResponse.ok) {
      console.error('Workflow execution failed:', workflowResult)
      return NextResponse.json(
        { success: false, error: workflowResult.error || 'Workflow execution failed' },
        { status: 500 }
      )
    }

    console.log('Workflow triggered successfully:', workflowResult)

    return NextResponse.json({
      success: true,
      message: `Workflow ${type} triggered successfully`,
      data: workflowResult
    })

  } catch (error) {
    console.error('Error triggering workflow:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 