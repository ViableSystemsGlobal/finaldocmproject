import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllAccountHealth, 
  performHealthCheck, 
  resetAccountHealth,
  EMAIL_LIMITS 
} from '@/lib/emailAccounts';
import { 
  getEmailServiceStats, 
  getRecentErrors, 
  canSendEmails 
} from '@/services/emailService';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Email Health Monitoring API
 * 
 * GET: Returns comprehensive email system health status
 * POST: Performs health checks and recovery actions
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeErrors = searchParams.get('includeErrors') === 'true';
    const includeQueue = searchParams.get('includeQueue') === 'true';
    
    console.log('📊 Fetching email health status...');
    
    // Get account health (initialize if empty)
    let accountHealth = getAllAccountHealth();
    
    // If no health data exists, initialize with default values for all accounts
    if (accountHealth.length === 0) {
      console.log('🔧 Initializing account health data...');
      // Trigger health check to initialize accounts
      performHealthCheck();
      accountHealth = getAllAccountHealth();
    }
    
    // Get service statistics
    const serviceStats = getEmailServiceStats();
    
    // Get send capability status
    const sendStatus = canSendEmails();
    
    // Get queue statistics if requested
    let queueStats = null;
    if (includeQueue) {
      try {
        const { data: queueData, error } = await supabaseAdmin
          .from('email_queue')
          .select('status')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours
        
        if (!error && queueData) {
          queueStats = {
            pending: queueData.filter(item => item.status === 'pending').length,
            sending: queueData.filter(item => item.status === 'sending').length,
            sent: queueData.filter(item => item.status === 'sent').length,
            failed: queueData.filter(item => item.status === 'failed').length,
            total: queueData.length
          };
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch queue statistics:', error);
      }
    }
    
    // Get recent errors if requested
    let recentErrors = null;
    if (includeErrors) {
      recentErrors = getRecentErrors();
    }
    
    // Calculate system health score (0-100)
    const healthyAccounts = accountHealth.filter(h => h.isHealthy).length;
    const totalAccounts = accountHealth.length;
    const avgSuccessRate = accountHealth.length > 0 
      ? accountHealth.reduce((sum, h) => sum + h.successRate, 0) / accountHealth.length 
      : 100;
    
    const systemHealthScore = Math.round((
      (healthyAccounts / totalAccounts) * 0.4 + // 40% weight for healthy accounts
      (avgSuccessRate / 100) * 0.4 + // 40% weight for success rate
      (sendStatus.canSend ? 1 : 0) * 0.2 // 20% weight for send capability
    ) * 100);
    
    const response = {
      timestamp: new Date().toISOString(),
      systemHealth: {
        score: systemHealthScore,
        status: systemHealthScore >= 90 ? 'excellent' : 
                systemHealthScore >= 70 ? 'good' : 
                systemHealthScore >= 50 ? 'warning' : 'critical',
        canSend: sendStatus.canSend,
        reason: sendStatus.reason
      },
      accounts: {
        total: totalAccounts,
        healthy: healthyAccounts,
        unhealthy: totalAccounts - healthyAccounts,
        details: accountHealth.map(health => ({
          email: health.email,
          isHealthy: health.isHealthy,
          successRate: Math.round(health.successRate * 100) / 100,
          totalSent: health.totalSent,
          totalFailed: health.totalFailed,
          hourlyCount: health.hourlyCount,
          hourlyLimit: EMAIL_LIMITS.perAccountHourly,
          utilizationPercent: Math.round((health.hourlyCount / EMAIL_LIMITS.perAccountHourly) * 100),
          lastUsed: health.lastUsed,
          lastFailure: health.lastFailure,
          failureCount: health.failureCount
        }))
      },
      statistics: {
        ...serviceStats,
        hourlyCapacity: healthyAccounts * EMAIL_LIMITS.perAccountHourly,
        currentUtilization: accountHealth.reduce((sum, h) => sum + h.hourlyCount, 0),
        totalSent: accountHealth.reduce((sum, h) => sum + h.totalSent, 0),
        totalFailed: accountHealth.reduce((sum, h) => sum + h.totalFailed, 0),
        successRate: accountHealth.length > 0 ? avgSuccessRate : 100
      },
      queue: queueStats,
      recentErrors: recentErrors,
      limits: EMAIL_LIMITS
    };
    
    console.log(`✅ Email health check complete: ${systemHealthScore}% health score`);
    
    return NextResponse.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('❌ Error fetching email health:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, account } = body;
    
    console.log(`🔧 Email health action: ${action}`, account ? `for ${account}` : '');
    
    switch (action) {
      case 'healthCheck':
        const healthResult = performHealthCheck();
        return NextResponse.json({
          success: true,
          message: 'Health check completed',
          data: healthResult
        });
        
      case 'resetAccount':
        if (!account) {
          return NextResponse.json({
            success: false,
            error: 'Account email is required for reset action'
          }, { status: 400 });
        }
        
        resetAccountHealth(account);
        return NextResponse.json({
          success: true,
          message: `Account ${account} health reset successfully`
        });
        
      case 'resetAllAccounts':
        const accounts = getAllAccountHealth();
        accounts.forEach(health => resetAccountHealth(health.email));
        return NextResponse.json({
          success: true,
          message: `Reset ${accounts.length} accounts successfully`
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: healthCheck, resetAccount, resetAllAccounts'
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('❌ Error in email health action:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 