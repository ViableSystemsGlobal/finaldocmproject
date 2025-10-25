import { NextRequest, NextResponse } from 'next/server'
import { testNotificationSystem, sendFollowUpAssignmentNotification, sendPrayerAssignmentNotification } from '@/services/notificationService'

/**
 * Test endpoint for the notification system
 * This endpoint allows testing various notification types
 */
export async function POST(request: NextRequest) {
  try {
    const { testType, userId, userIds, followUpData, prayerData, assignedByUserName } = await request.json()
    
    if (!testType) {
      return NextResponse.json(
        { success: false, error: 'testType is required' },
        { status: 400 }
      )
    }
    
    if (!userId && !userIds) {
      return NextResponse.json(
        { success: false, error: 'Either userId or userIds is required' },
        { status: 400 }
      )
    }

    console.log(`🧪 Testing notification system - Type: ${testType}, User: ${userId}`)

    let result

    switch (testType) {
      case 'basic':
        // Test basic notification system
        result = await testNotificationSystem(userId, 'both')
        break
        
      case 'email':
        // Test email only
        result = await testNotificationSystem(userId, 'email')
        break
        
      case 'follow_up_assignment':
        // Test follow-up assignment notification
        const testFollowUpData = followUpData || {
          id: 'test-follow-up-' + Date.now(),
          contactName: 'Test Contact',
          type: 'pastoral_care',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          notes: 'This is a test follow-up assignment notification.'
        }
        
        result = await sendFollowUpAssignmentNotification(
          userId,
          testFollowUpData,
          assignedByUserName || 'Test Admin'
        )
        break
        
      case 'prayer_assignment':
        // Test prayer assignment notification
        const testPrayerData = prayerData || {
          id: 'test-prayer-' + Date.now(),
          title: 'Test Prayer Request',
          submitterName: 'Test Member',
          category: 'health',
          message: 'This is a test prayer request assignment notification. Please pray for healing and recovery.',
          isConfidential: false,
          urgency: 'normal'
        }
        
        result = await sendPrayerAssignmentNotification(
          userId,
          testPrayerData,
          assignedByUserName || 'Test Admin'
        )
        break
        
      case 'multi_person_prayer_assignment':
        // Test multi-person prayer assignment
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
          return NextResponse.json(
            { success: false, error: 'userIds array is required for multi_person_prayer_assignment test' },
            { status: 400 }
          )
        }
        
        // Import the multi-person assignment function
        const { assignPrayerRequestsToUsers } = await import('@/services/prayerRequests')
        
        const testMultiPrayerData = prayerData || [
          {
            id: 'test-multi-prayer-1-' + Date.now(),
            title: 'Prayer for Healing',
            submitterName: 'Test Member 1',
            category: 'health',
            message: 'This is a test prayer request for healing and recovery.',
            isConfidential: false,
            urgency: 'normal'
          },
          {
            id: 'test-multi-prayer-2-' + Date.now(),
            title: 'Prayer for Guidance',
            submitterName: 'Test Member 2', 
            category: 'guidance',
            message: 'This is a test prayer request for guidance in difficult decisions.',
            isConfidential: true,
            urgency: 'high'
          }
        ]
        
        // Note: For testing purposes, we'll just test the notification function 
        // without actually creating database records
        let multiResults = []
        for (const testUserId of userIds) {
          for (const prayer of testMultiPrayerData) {
            const notificationResult = await sendPrayerAssignmentNotification(
              testUserId,
              prayer,
              assignedByUserName || 'Test Admin'
            )
            multiResults.push({
              userId: testUserId,
              prayerId: prayer.id,
              success: notificationResult.success,
              error: notificationResult.error
            })
          }
        }
        
        const successCount = multiResults.filter(r => r.success).length
        const failedCount = multiResults.filter(r => !r.success).length
        
        result = {
          success: successCount > 0,
          message: `Multi-person assignment test: ${successCount} notifications sent, ${failedCount} failed`,
          results: multiResults,
          totalNotifications: multiResults.length
        }
        break
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid test type. Use: basic, email, follow_up_assignment, prayer_assignment, or multi_person_prayer_assignment' },
          { status: 400 }
        )
    }

    console.log(`📊 Test result:`, result)

    return NextResponse.json({
      success: true,
      message: `Test notification sent successfully`,
      testType,
      userId,
      result: {
        success: result.success,
        emailSent: result.emailSent,
        pushSent: result.pushSent,
        error: result.error
      }
    })

  } catch (error) {
    console.error('❌ Error testing notifications:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check notification system status
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const checkType = url.searchParams.get('check') || 'status'

    switch (checkType) {
      case 'status':
        return NextResponse.json({
          success: true,
          message: 'Notification system is available',
          availableTests: [
            'basic - Test basic notification system',
            'email - Test email notifications only',
            'follow_up_assignment - Test follow-up assignment notifications',
            'prayer_assignment - Test prayer assignment notifications',
            'multi_person_prayer_assignment - Test multi-person prayer assignment notifications'
          ],
          usage: {
            POST: '/api/test-notifications',
            body: {
              testType: 'basic|email|follow_up_assignment|prayer_assignment|multi_person_prayer_assignment',
              userId: 'user-uuid (required for single-user tests)',
              userIds: 'array of user-uuids (required for multi_person_prayer_assignment)',
              followUpData: 'optional - for follow_up_assignment test',
              prayerData: 'optional - for prayer_assignment test (array for multi_person test)',
              assignedByUserName: 'optional - for assignment tests'
            }
          }
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid check type' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Error checking notification system:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 