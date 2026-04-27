// pages/admin/security.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { legacyClient } from '../../lib/legacyClient'
import { auditLog } from '../../lib/security'

interface AuditLog {
  id: string
  action: string
  user_id: string
  details: any
  ip_address: string
  user_agent: string
  timestamp: string
  profiles?: {
    id: string
  }
}

interface SecurityMetrics {
  totalLogs: number
  suspiciousActivities: number
  blockedAttempts: number
  activeUsers: number
}

export default function SecurityDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalLogs: 0,
    suspiciousActivities: 0,
    blockedAttempts: 0,
    activeUsers: 0
  })
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    page: 1,
    limit: 20
  })

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchAuditLogs()
      fetchMetrics()
    }
  }, [user, filters])

  const checkUser = async () => {
    try {
      const { data: { user } } = await legacyClient.auth.getUser()
      
      if (!user) {
        router.push('/admin/login')
        return
      }

      const { data: profile, error } = await legacyClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error || profile?.role !== 'admin') {
        router.push('/admin/login')
        return
      }

      setUser(user)
      
      // Log admin access
      await auditLog('admin_security_access', user.id, {
        page: 'security_dashboard'
      })
      
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchAuditLogs = async () => {
    try {
      const { data: { session } } = await legacyClient.auth.getSession()
      if (!session) return

      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        ...(filters.action && { action: filters.action }),
        ...(filters.userId && { userId: filters.userId })
      })

      const response = await fetch(`/api/admin/security/audit-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    }
  }

  const fetchMetrics = async () => {
    try {
      // Get total logs count
      const { count: totalLogs } = await legacyClient
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })

      // Get suspicious activities (login attempts, admin access, etc.)
      const { count: suspiciousActivities } = await legacyClient
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .in('action', ['failed_login', 'admin_access', 'suspicious_activity'])

      // Get blocked attempts (would need middleware logs integration)
      const blockedAttempts = 0 // Placeholder - would integrate with middleware logs

      // Get active users (last 24 hours)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const { data: activeUsersData } = await legacyClient
        .from('audit_logs')
        .select('user_id')
        .gte('timestamp', yesterday.toISOString())
        .not('user_id', 'is', null)

      const activeUsers = new Set(activeUsersData?.map(log => log.user_id)).size

      setMetrics({
        totalLogs: totalLogs || 0,
        suspiciousActivities: suspiciousActivities || 0,
        blockedAttempts,
        activeUsers
      })
    } catch (error) {
      console.error('Error fetching metrics:', error)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN')
  }

  const getActionBadgeClass = (action: string) => {
    if (action.includes('failed') || action.includes('blocked')) {
      return 'badge bg-danger'
    } else if (action.includes('admin')) {
      return 'badge bg-warning'
    } else if (action.includes('login') || action.includes('success')) {
      return 'badge bg-success'
    }
    return 'badge bg-secondary'
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Security Dashboard</h2>
            <button 
              className="btn btn-secondary"
              onClick={() => router.push('/admin/dashboard')}
            >
               Back to Dashboard
            </button>
          </div>

          {/* Security Metrics */}
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="card border-0 bg-light">
                <div className="card-body text-center">
                  <h3 className="text-primary mb-1">{metrics.totalLogs}</h3>
                  <p className="text-muted mb-0">Total Logs</p>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card border-0 bg-light">
                <div className="card-body text-center">
                  <h3 className="text-warning mb-1">{metrics.suspiciousActivities}</h3>
                  <p className="text-muted mb-0">Suspicious Activities</p>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card border-0 bg-light">
                <div className="card-body text-center">
                  <h3 className="text-danger mb-1">{metrics.blockedAttempts}</h3>
                  <p className="text-muted mb-0">Blocked Attempts</p>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card border-0 bg-light">
                <div className="card-body text-center">
                  <h3 className="text-success mb-1">{metrics.activeUsers}</h3>
                  <p className="text-muted mb-0">Active Users (24h)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Filters</h5>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="action" className="form-label">Action</label>
                  <select 
                    className="form-select"
                    id="action"
                    value={filters.action}
                    onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value, page: 1 }))}
                  >
                    <option value="">All Actions</option>
                    <option value="login">Login</option>
                    <option value="logout">Logout</option>
                    <option value="admin_access">Admin Access</option>
                    <option value="failed_login">Failed Login</option>
                    <option value="certificate_issued">Certificate Issued</option>
                    <option value="certificate_verified">Certificate Verified</option>
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="limit" className="form-label">Records per page</label>
                  <select 
                    className="form-select"
                    id="limit"
                    value={filters.limit}
                    onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="refresh" className="form-label">&nbsp;</label>
                  <button 
                    className="btn btn-primary w-100"
                    onClick={() => {
                      fetchAuditLogs()
                      fetchMetrics()
                    }}
                  >
                     Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Audit Logs</h5>
            </div>
            <div className="card-body p-0">
              {logs.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No audit logs found</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Timestamp</th>
                        <th>Action</th>
                        <th>User</th>
                        <th>IP Address</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <small>{formatTimestamp(log.timestamp)}</small>
                          </td>
                          <td>
                            <span className={getActionBadgeClass(log.action)}>
                              {log.action}
                            </span>
                          </td>
                          <td>
                            {log.user_id ? (
                              <div>
                                <div className="fw-bold">User ID: {log.user_id.substring(0, 8)}...</div>
                                <small className="text-muted">Admin User</small>
                              </div>
                            ) : (
                              <span className="text-muted">System</span>
                            )}
                          </td>
                          <td>
                            <small className="text-muted">{log.ip_address || 'N/A'}</small>
                          </td>
                          <td>
                            <small>
                              {typeof log.details === 'object' ? 
                                JSON.stringify(log.details).slice(0, 100) + '...' : 
                                log.details || 'No details'
                              }
                            </small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Security Recommendations */}
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0"> Security Recommendations</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6> Implemented Security Measures:</h6>
                  <ul className="list-unstyled">
                    <li className="mb-2"> Rate limiting on API endpoints</li>
                    <li className="mb-2"> Security headers (CSP, HSTS, etc.)</li>
                    <li className="mb-2"> XSS and SQL injection protection</li>
                    <li className="mb-2"> Comprehensive audit logging</li>
                    <li className="mb-2"> Row Level Security (RLS) on database</li>
                    <li className="mb-2"> Role-based access control</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6> Additional Free Security Tools:</h6>
                  <ul className="list-unstyled">
                    <li className="mb-2"> <strong>Cloudflare:</strong> Free DDoS protection</li>
                    <li className="mb-2"> <strong>Google Analytics:</strong> Monitor traffic patterns</li>
                    <li className="mb-2"> <strong>UptimeRobot:</strong> Free uptime monitoring</li>
                    <li className="mb-2"> <strong>Let's Encrypt:</strong> Free SSL certificates</li>
                    <li className="mb-2"> <strong>legacyClient Auth:</strong> Built-in authentication</li>
                    <li className="mb-2"> <strong>GitHub Dependabot:</strong> Dependency updates</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}