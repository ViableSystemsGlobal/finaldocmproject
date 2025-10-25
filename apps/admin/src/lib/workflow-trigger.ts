/**
 * Server-side workflow trigger utility
 * This can be used in server-side code where fetch to localhost won't work
 */

export async function triggerWorkflowServerSide(type: string, contactId: string, eventId?: string) {
  try {
    console.log('Triggering workflow server-side:', { type, contactId, eventId })

    // Call the Supabase edge function directly
    const response = await fetch(
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

    const result = await response.json()

    if (!response.ok) {
      console.error('Workflow execution failed:', result)
      throw new Error(result.error || 'Workflow execution failed')
    }

    console.log('Workflow triggered successfully:', result)
    return { success: true, data: result }

  } catch (error) {
    console.error('Error triggering workflow:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Trigger welcome workflow for new members (server-side)
 */
export async function triggerWelcomeWorkflowServerSide(contactId: string) {
  return triggerWorkflowServerSide('new_member', contactId)
} 