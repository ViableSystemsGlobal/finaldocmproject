/**
 * Enhanced Email Accounts Module
 * 
 * Manages multiple Hostinger email accounts for improved sending capacity,
 * with specialization for different types of emails, rate limiting, and health monitoring.
 */

// For security, the password should come from environment variables in production
const SHARED_PASSWORD = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS || '4R*]IL4QyS$';

// Email sending limits and configuration
export const EMAIL_LIMITS = {
  perAccountHourly: 500,     // emails per hour per account
  perCampaignHourly: 4500,   // total per hour (9 accounts × 500)
  delayBetweenSends: 100,    // ms between individual sends
  maxRetriesPerAccount: 3,   // retry attempts for failed accounts
  healthCheckInterval: 300000, // 5 minutes
};

// Account health tracking
interface AccountHealth {
  email: string;
  isHealthy: boolean;
  lastUsed: Date;
  hourlyCount: number;
  failureCount: number;
  lastFailure?: Date;
  successRate: number;
  totalSent: number;
  totalFailed: number;
}

// In-memory health tracking (in production, use Redis or database)
const accountHealth = new Map<string, AccountHealth>();

// Gmail fallback configuration (for testing when Hostinger is not available)
const GMAIL_FALLBACK = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER || '',
    pass: process.env.GMAIL_APP_PASSWORD || ''
  }
};

// Hostinger SMTP Configuration
export const HOSTINGER_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT || '465', 10) === 465,
};

// Check if we should use Gmail fallback
export const USE_GMAIL_FALLBACK = process.env.USE_GMAIL_FALLBACK === 'true' || 
  (!process.env.EMAIL_PASSWORD && !process.env.SMTP_PASS && 
   process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

// Get SMTP configuration
export function getSMTPConfig() {
  if (USE_GMAIL_FALLBACK) {
    return {
      host: GMAIL_FALLBACK.host,
      port: GMAIL_FALLBACK.port,
      secure: GMAIL_FALLBACK.secure,
      auth: GMAIL_FALLBACK.auth
    };
  }
  
  return {
    host: HOSTINGER_CONFIG.host,
    port: HOSTINGER_CONFIG.port,
    secure: HOSTINGER_CONFIG.secure,
    auth: {
      user: '', // Will be set by getSenderAccount
      pass: SHARED_PASSWORD
    }
  };
}

// All available email accounts with correct passwords
export const EMAIL_ACCOUNTS = [
  { email: 'admin@docmchurch.org', type: 'admin', password: 'h:PF?0~H', priority: 1 },
  { email: 'info@docmchurch.org', type: 'info', password: SHARED_PASSWORD, priority: 1 },
  { email: 'events@docmchurch.org', type: 'events', password: SHARED_PASSWORD, priority: 1 },
  { email: 'no-reply@docmchurch.org', type: 'system', password: SHARED_PASSWORD, priority: 1 },
  { email: 'no-reply1@docmchurch.org', type: 'bulk', password: SHARED_PASSWORD, priority: 1 },
  { email: 'no-reply2@docmchurch.org', type: 'bulk', password: SHARED_PASSWORD, priority: 1 },
  { email: 'no-reply3@docmchurch.org', type: 'bulk', password: SHARED_PASSWORD, priority: 1 },
  { email: 'no-reply4@docmchurch.org', type: 'bulk', password: SHARED_PASSWORD, priority: 2 },
  { email: 'no-reply5@docmchurch.org', type: 'bulk', password: SHARED_PASSWORD, priority: 2 },
  { email: 'no-reply6@docmchurch.org', type: 'bulk', password: SHARED_PASSWORD, priority: 2 },
  { email: 'no-reply7@docmchurch.org', type: 'bulk', password: SHARED_PASSWORD, priority: 3 },
  { email: 'no-reply8@docmchurch.org', type: 'bulk', password: SHARED_PASSWORD, priority: 3 },
  { email: 'no-reply9@docmchurch.org', type: 'bulk', password: SHARED_PASSWORD, priority: 3 },
];

// Gmail fallback account
const GMAIL_ACCOUNT = {
  email: process.env.GMAIL_USER || 'test@gmail.com',
  type: 'gmail',
  password: process.env.GMAIL_APP_PASSWORD || '',
  priority: 1
};

// Counter for round-robin selection
let emailCounter = 0;

// Initialize account health tracking
function initializeAccountHealth(email: string) {
  if (!accountHealth.has(email)) {
    accountHealth.set(email, {
      email,
      isHealthy: true,
      lastUsed: new Date(),
      hourlyCount: 0,
      failureCount: 0,
      successRate: 100,
      totalSent: 0,
      totalFailed: 0
    });
  }
}

// Update account health after send attempt
export function updateAccountHealth(email: string, success: boolean, error?: string) {
  initializeAccountHealth(email);
  const health = accountHealth.get(email)!;
  
  health.lastUsed = new Date();
  
  if (success) {
    health.totalSent++;
    health.hourlyCount++;
    health.failureCount = 0; // Reset failure count on success
  } else {
    health.totalFailed++;
    health.failureCount++;
    health.lastFailure = new Date();
    
    // Mark as unhealthy if too many consecutive failures
    if (health.failureCount >= EMAIL_LIMITS.maxRetriesPerAccount) {
      health.isHealthy = false;
      console.warn(`🚨 Account ${email} marked as unhealthy after ${health.failureCount} failures`);
    }
  }
  
  // Calculate success rate
  const total = health.totalSent + health.totalFailed;
  health.successRate = total > 0 ? (health.totalSent / total) * 100 : 100;
  
  console.log(`📊 Account ${email}: ${health.totalSent} sent, ${health.totalFailed} failed, ${health.successRate.toFixed(1)}% success rate`);
}

// Check if account can send (not over rate limit and healthy)
export function canAccountSend(email: string): boolean {
  initializeAccountHealth(email);
  const health = accountHealth.get(email)!;
  
  // Reset hourly count if it's been an hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (health.lastUsed < oneHourAgo) {
    health.hourlyCount = 0;
  }
  
  const canSend = health.isHealthy && health.hourlyCount < EMAIL_LIMITS.perAccountHourly;
  
  if (!canSend) {
    console.log(`⚠️ Account ${email} cannot send: healthy=${health.isHealthy}, hourlyCount=${health.hourlyCount}/${EMAIL_LIMITS.perAccountHourly}`);
  }
  
  return canSend;
}

// Get account health status
export function getAccountHealth(email: string): AccountHealth | null {
  return accountHealth.get(email) || null;
}

// Get all account health statuses
export function getAllAccountHealth(): AccountHealth[] {
  return Array.from(accountHealth.values());
}

// Reset account health (useful for manual recovery)
export function resetAccountHealth(email: string) {
  initializeAccountHealth(email);
  const health = accountHealth.get(email)!;
  health.isHealthy = true;
  health.failureCount = 0;
  health.hourlyCount = 0;
  delete health.lastFailure;
  console.log(`✅ Account ${email} health reset`);
}

// Get an appropriate sender account based on email type with health checking
export function getSenderAccount(emailType = 'system') {
  // If using Gmail fallback, return Gmail account
  if (USE_GMAIL_FALLBACK) {
    return GMAIL_ACCOUNT;
  }
  
  // Special purpose emails - try primary first, fallback to healthy bulk accounts
  if (emailType === 'admin') {
    const adminAccount = EMAIL_ACCOUNTS[0];
    if (canAccountSend(adminAccount.email)) {
      return adminAccount;
    }
    // Fallback to healthy bulk account
    emailType = 'bulk';
  }
  
  if (emailType === 'info') {
    const infoAccount = EMAIL_ACCOUNTS[1];
    if (canAccountSend(infoAccount.email)) {
      return infoAccount;
    }
    emailType = 'bulk';
  }
  
  if (emailType === 'events') {
    const eventsAccount = EMAIL_ACCOUNTS[2];
    if (canAccountSend(eventsAccount.email)) {
      return eventsAccount;
    }
    emailType = 'bulk';
  }
  
  if (emailType === 'system') {
    const systemAccount = EMAIL_ACCOUNTS[3];
    if (canAccountSend(systemAccount.email)) {
      return systemAccount;
    }
    emailType = 'bulk';
  }
  
  // For bulk emails or fallbacks, use healthy bulk accounts in round-robin fashion
  const bulkAccounts = EMAIL_ACCOUNTS.filter(a => a.type === 'bulk');
  const healthyBulkAccounts = bulkAccounts.filter(a => canAccountSend(a.email));
  
  if (healthyBulkAccounts.length === 0) {
    console.error('🚨 No healthy bulk accounts available! Using first bulk account anyway.');
    return bulkAccounts[0] || EMAIL_ACCOUNTS[4]; // Fallback to no-reply1
  }
  
  // Sort by priority and then round-robin within same priority
  healthyBulkAccounts.sort((a, b) => a.priority - b.priority);
  const index = (emailCounter++) % healthyBulkAccounts.length;
  const selectedAccount = healthyBulkAccounts[index];
  
  console.log(`📧 Selected account: ${selectedAccount.email} (${healthyBulkAccounts.length} healthy accounts available)`);
  return selectedAccount;
}

// Get all healthy bulk sender accounts for campaigns
export function getBulkSenderAccounts() {
  if (USE_GMAIL_FALLBACK) {
    return [GMAIL_ACCOUNT];
  }
  
  const bulkAccounts = EMAIL_ACCOUNTS.filter(a => a.type === 'bulk');
  const healthyAccounts = bulkAccounts.filter(a => canAccountSend(a.email));
  
  if (healthyAccounts.length === 0) {
    console.warn('⚠️ No healthy bulk accounts, returning all bulk accounts');
    return bulkAccounts;
  }
  
  return healthyAccounts;
}

// Enhanced recipient distribution with health-aware load balancing
export function distributeRecipients(recipients: string[]) {
  const healthyAccounts = getBulkSenderAccounts();
  
  if (healthyAccounts.length === 0) {
    throw new Error('No email accounts available for sending');
  }
  
  // Calculate optimal chunk size based on healthy accounts
  const chunkSize = Math.ceil(recipients.length / healthyAccounts.length);
  
  // Split recipients into chunks
  const distribution = [];
  for (let i = 0; i < recipients.length; i += chunkSize) {
    const chunkRecipients = recipients.slice(i, i + chunkSize);
    const accountIndex = Math.floor(i / chunkSize) % healthyAccounts.length;
    
    distribution.push({
      account: healthyAccounts[accountIndex],
      recipients: chunkRecipients,
      estimatedSendTime: chunkRecipients.length * EMAIL_LIMITS.delayBetweenSends
    });
  }
  
  console.log(`📊 Distributed ${recipients.length} recipients across ${healthyAccounts.length} healthy accounts`);
  distribution.forEach((dist, idx) => {
    console.log(`  Account ${idx + 1}: ${dist.account.email} - ${dist.recipients.length} recipients (~${Math.round(dist.estimatedSendTime/1000)}s)`);
  });
  
  return distribution;
}

// Health monitoring and recovery functions
export function performHealthCheck() {
  console.log('🔍 Performing email accounts health check...');
  
  const allAccounts = [...EMAIL_ACCOUNTS, GMAIL_ACCOUNT];
  let healthyCount = 0;
  let unhealthyCount = 0;
  
  allAccounts.forEach(account => {
    const health = getAccountHealth(account.email);
    if (health) {
      if (health.isHealthy) {
        healthyCount++;
      } else {
        unhealthyCount++;
        
        // Auto-recovery: reset accounts that have been unhealthy for > 1 hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (health.lastFailure && health.lastFailure < oneHourAgo) {
          console.log(`🔄 Auto-recovering account ${account.email} after 1 hour`);
          resetAccountHealth(account.email);
          healthyCount++;
          unhealthyCount--;
        }
      }
    } else {
      // Initialize health for new accounts
      initializeAccountHealth(account.email);
      healthyCount++;
    }
  });
  
  console.log(`✅ Health check complete: ${healthyCount} healthy, ${unhealthyCount} unhealthy accounts`);
  
  return {
    healthy: healthyCount,
    unhealthy: unhealthyCount,
    total: allAccounts.length
  };
}

// Start periodic health checks
if (typeof window === 'undefined') { // Only run on server side
  setInterval(performHealthCheck, EMAIL_LIMITS.healthCheckInterval);
} 