// pages/api/admin/security/audit-logs.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { legacyAdmin } from '../../../../lib/legacyAdmin'
import { sanitizeInput } from '../../../../lib/security'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get current user
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid session' })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await legacyAdmin.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid session' })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await legacyAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    // Get query parameters
    const page = parseInt(sanitizeInput(req.query.page as string)) || 1
    const limit = Math.min(parseInt(sanitizeInput(req.query.limit as string)) || 50, 100)
    const action = sanitizeInput(req.query.action as string)
    const userId = sanitizeInput(req.query.userId as string)

    let query = legacyAdmin
      .from('audit_logs')
      .select(`
        *,
        profiles!user_id (
          id
        )
      `)
      .order('timestamp', { ascending: false })

    // Apply filters
    if (action) {
      query = query.eq('action', action)
    }
    
    if (userId) {
      query = query.eq('user_id', userId)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: logs, error: logsError, count } = await query
      .range(from, to)
      .limit(limit)

    if (logsError) {
      console.error('Error fetching audit logs:', logsError)
      return res.status(500).json({ error: 'Failed to fetch audit logs' })
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await legacyAdmin
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error counting audit logs:', countError)
      return res.status(500).json({ error: 'Failed to count audit logs' })
    }

    res.status(200).json({
      logs: logs || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in audit logs API:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}