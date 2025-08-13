// ブルートフォース攻撃対策 - レート制限・ログイン試行回数制限
import { LRUCache } from 'lru-cache'

// インメモリキャッシュ設定（Redis代替）
interface RateLimitAttempt {
  attempts: number
  lockUntil?: number
  firstAttempt: number
}

// IPベースのレート制限キャッシュ
const ipAttemptCache = new LRUCache<string, RateLimitAttempt>({
  max: 10000, // 最大10,000のIPを追跡
  ttl: 1000 * 60 * 60, // 1時間でエントリを削除
})

// ユーザーベースのレート制限キャッシュ
const userAttemptCache = new LRUCache<string, RateLimitAttempt>({
  max: 50000, // 最大50,000のユーザーを追跡
  ttl: 1000 * 60 * 60 * 24, // 24時間でエントリを削除
})

// セキュリティ設定（要件準拠: 1分5回制限）
const SECURITY_CONFIG = {
  // API制限設定（要件準拠）
  API_LIMIT: {
    maxAttempts: 5, // 1分間に5回まで（要件準拠）
    windowMs: 60 * 1000, // 1分間
    lockoutMs: 5 * 60 * 1000, // 5分ロック
  },
  // IP制限設定（保持・少し緩和）
  IP_LIMIT: {
    maxAttempts: 10, // IP単位での最大試行回数
    windowMs: 15 * 60 * 1000, // 15分間
    lockoutMs: 60 * 60 * 1000, // 1時間ロック
  },
  // ユーザー制限設定（保持）
  USER_LIMIT: {
    maxAttempts: 5, // ユーザー単位での最大試行回数
    windowMs: 15 * 60 * 1000, // 15分間
    lockoutMs: 30 * 60 * 1000, // 30分ロック
  },
  // 段階的ロック設定
  PROGRESSIVE_LOCKOUT: {
    1: 60 * 1000,        // 1回目: 1分
    2: 5 * 60 * 1000,    // 2回目: 5分
    3: 15 * 60 * 1000,   // 3回目: 15分
    4: 60 * 60 * 1000,   // 4回目以降: 1時間
  }
}

/**
 * API制限チェック（要件準拠: 1分5回制限）
 */
export function checkAPIRateLimit(ip: string): {
  success: boolean
  remainingAttempts: number
  lockUntil?: number
  error?: string
} {
  const now = Date.now()
  const key = `api:${ip}`
  
  let record = ipAttemptCache.get(key)
  
  // 初回アクセス
  if (!record) {
    record = {
      attempts: 1,
      firstAttempt: now
    }
    ipAttemptCache.set(key, record)
    
    return {
      success: true,
      remainingAttempts: SECURITY_CONFIG.API_LIMIT.maxAttempts - 1
    }
  }
  
  // ロック期間中かチェック
  if (record.lockUntil && now < record.lockUntil) {
    return {
      success: false,
      remainingAttempts: 0,
      lockUntil: record.lockUntil,
      error: `API制限: IP ${ip} は一時的にブロックされています。`
    }
  }
  
  // 時間窓のリセット
  if (now - record.firstAttempt > SECURITY_CONFIG.API_LIMIT.windowMs) {
    record = {
      attempts: 1,
      firstAttempt: now
    }
    ipAttemptCache.set(key, record)
    
    return {
      success: true,
      remainingAttempts: SECURITY_CONFIG.API_LIMIT.maxAttempts - 1
    }
  }
  
  // 制限チェック
  const remainingAttempts = SECURITY_CONFIG.API_LIMIT.maxAttempts - record.attempts
  
  if (remainingAttempts <= 0) {
    // ロック設定
    record.lockUntil = now + SECURITY_CONFIG.API_LIMIT.lockoutMs
    ipAttemptCache.set(key, record)
    
    return {
      success: false,
      remainingAttempts: 0,
      lockUntil: record.lockUntil,
      error: `API制限超過: IP ${ip} は${Math.ceil(SECURITY_CONFIG.API_LIMIT.lockoutMs / 60000)}分間ブロックされました。`
    }
  }
  
  // アクセス記録
  record.attempts++
  ipAttemptCache.set(key, record)
  
  return {
    success: true,
    remainingAttempts: remainingAttempts - 1
  }
}

/**
 * IPアドレスベースのレート制限チェック
 */
export function checkIPRateLimit(ip: string): {
  success: boolean
  remainingAttempts: number
  lockUntil?: number
  error?: string
} {
  const now = Date.now()
  const key = `ip:${ip}`
  
  let record = ipAttemptCache.get(key)
  
  // 初回アクセス
  if (!record) {
    record = {
      attempts: 0,
      firstAttempt: now
    }
  }
  
  // ロック期間中かチェック
  if (record.lockUntil && now < record.lockUntil) {
    return {
      success: false,
      remainingAttempts: 0,
      lockUntil: record.lockUntil,
      error: `IP ${ip} is temporarily blocked. Please try again later.`
    }
  }
  
  // 時間窓のリセット
  if (now - record.firstAttempt > SECURITY_CONFIG.IP_LIMIT.windowMs) {
    record = {
      attempts: 0,
      firstAttempt: now
    }
  }
  
  // 制限チェック
  const remainingAttempts = SECURITY_CONFIG.IP_LIMIT.maxAttempts - record.attempts
  
  if (remainingAttempts <= 0) {
    // ロック設定
    record.lockUntil = now + SECURITY_CONFIG.IP_LIMIT.lockoutMs
    ipAttemptCache.set(key, record)
    
    return {
      success: false,
      remainingAttempts: 0,
      lockUntil: record.lockUntil,
      error: `Too many login attempts from IP ${ip}. Blocked for 1 hour.`
    }
  }
  
  return {
    success: true,
    remainingAttempts
  }
}

/**
 * ユーザーベースのレート制限チェック
 */
export function checkUserRateLimit(email: string): {
  success: boolean
  remainingAttempts: number
  lockUntil?: number
  error?: string
} {
  const now = Date.now()
  const key = `user:${email.toLowerCase()}`
  
  let record = userAttemptCache.get(key)
  
  // 初回アクセス
  if (!record) {
    record = {
      attempts: 0,
      firstAttempt: now
    }
  }
  
  // ロック期間中かチェック
  if (record.lockUntil && now < record.lockUntil) {
    return {
      success: false,
      remainingAttempts: 0,
      lockUntil: record.lockUntil,
      error: `Account ${email} is temporarily blocked. Please try again later.`
    }
  }
  
  // 時間窓のリセット
  if (now - record.firstAttempt > SECURITY_CONFIG.USER_LIMIT.windowMs) {
    record = {
      attempts: 0,
      firstAttempt: now
    }
  }
  
  // 制限チェック
  const remainingAttempts = SECURITY_CONFIG.USER_LIMIT.maxAttempts - record.attempts
  
  if (remainingAttempts <= 0) {
    // 段階的ロック時間設定
    const lockoutIndex = Math.min(record.attempts - SECURITY_CONFIG.USER_LIMIT.maxAttempts + 1, 4)
    const lockoutMs = SECURITY_CONFIG.PROGRESSIVE_LOCKOUT[lockoutIndex] || SECURITY_CONFIG.PROGRESSIVE_LOCKOUT[4]
    
    record.lockUntil = now + lockoutMs
    userAttemptCache.set(key, record)
    
    const lockoutMinutes = Math.ceil(lockoutMs / 60000)
    
    return {
      success: false,
      remainingAttempts: 0,
      lockUntil: record.lockUntil,
      error: `Account ${email} is temporarily blocked for ${lockoutMinutes} minutes due to too many failed login attempts.`
    }
  }
  
  return {
    success: true,
    remainingAttempts
  }
}

/**
 * ログイン試行を記録（失敗時）
 */
export function recordFailedAttempt(ip: string, email: string): void {
  const now = Date.now()
  
  // IP試行記録
  const ipKey = `ip:${ip}`
  const ipRecord = ipAttemptCache.get(ipKey) || {
    attempts: 0,
    firstAttempt: now
  }
  
  ipRecord.attempts++
  ipAttemptCache.set(ipKey, ipRecord)
  
  // ユーザー試行記録
  const userKey = `user:${email.toLowerCase()}`
  const userRecord = userAttemptCache.get(userKey) || {
    attempts: 0,
    firstAttempt: now
  }
  
  userRecord.attempts++
  userAttemptCache.set(userKey, userRecord)
}

/**
 * ログイン成功時のリセット
 */
export function resetAttempts(ip: string, email: string): void {
  const ipKey = `ip:${ip}`
  const userKey = `user:${email.toLowerCase()}`
  
  // 成功したら試行回数をリセット（完全削除はしない）
  const ipRecord = ipAttemptCache.get(ipKey)
  if (ipRecord) {
    ipRecord.attempts = 0
    delete ipRecord.lockUntil
    ipAttemptCache.set(ipKey, ipRecord)
  }
  
  const userRecord = userAttemptCache.get(userKey)
  if (userRecord) {
    userRecord.attempts = 0
    delete userRecord.lockUntil
    userAttemptCache.set(userKey, userRecord)
  }
}

/**
 * 管理者用: 特定IPまたはユーザーのブロックを手動解除
 */
export function unblockIpOrUser(identifier: string, type: 'ip' | 'user'): boolean {
  const key = `${type}:${identifier.toLowerCase()}`
  const cache = type === 'ip' ? ipAttemptCache : userAttemptCache
  
  const record = cache.get(key)
  if (record) {
    record.attempts = 0
    delete record.lockUntil
    cache.set(key, record)
    return true
  }
  
  return false
}

/**
 * 統計情報の取得
 */
export function getSecurityStats() {
  const ipStats = {
    totalIPs: ipAttemptCache.size,
    blockedIPs: 0
  }
  
  const userStats = {
    totalUsers: userAttemptCache.size,
    blockedUsers: 0
  }
  
  const now = Date.now()
  
  // ブロック中のIPカウント
  for (const [, record] of ipAttemptCache.entries()) {
    if (record.lockUntil && now < record.lockUntil) {
      ipStats.blockedIPs++
    }
  }
  
  // ブロック中のユーザーカウント
  for (const [, record] of userAttemptCache.entries()) {
    if (record.lockUntil && now < record.lockUntil) {
      userStats.blockedUsers++
    }
  }
  
  return {
    ip: ipStats,
    user: userStats,
    config: SECURITY_CONFIG
  }
}

/**
 * レート制限情報の取得（デバッグ用）
 */
export function getRateLimitInfo(ip: string, email?: string) {
  const now = Date.now()
  
  const ipRecord = ipAttemptCache.get(`ip:${ip}`)
  const userRecord = email ? userAttemptCache.get(`user:${email.toLowerCase()}`) : null
  
  return {
    ip: {
      attempts: ipRecord?.attempts || 0,
      locked: ipRecord?.lockUntil ? now < ipRecord.lockUntil : false,
      lockUntil: ipRecord?.lockUntil,
      remaining: ipRecord ? SECURITY_CONFIG.IP_LIMIT.maxAttempts - ipRecord.attempts : SECURITY_CONFIG.IP_LIMIT.maxAttempts
    },
    user: userRecord ? {
      attempts: userRecord.attempts,
      locked: userRecord.lockUntil ? now < userRecord.lockUntil : false,
      lockUntil: userRecord.lockUntil,
      remaining: SECURITY_CONFIG.USER_LIMIT.maxAttempts - userRecord.attempts
    } : null
  }
}