// pages/api/exam/emergency-save.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { legacyAdmin } from '../../../lib/legacyAdmin'

import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { attemptId, data, sessionToken } = JSON.parse(typeof req.body === 'string' ? req.body : JSON.stringify(req.body))

    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized: Missing session token' })
    }

    const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
    const authResult = await convexClient.query(api.auth.verifySession, { token: sessionToken })
    if (!authResult.valid) {
      return res.status(401).json({ error: 'Unauthorized: Invalid session' })
    }

    if (!attemptId || !data) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Save the emergency data to a temporary table or update answers
    if (data.answers && Object.keys(data.answers).length > 0) {
      // Get the attempt to verify it exists and get questions
      const { data: attempt, error: attemptError } = await legacyAdmin
        .from('exam_attempts')
        .select(`
          id,
          exam_id,
          exams:exam_id (
            course_id
          )
        `)
        .eq('id', attemptId)
        .single()

      if (attemptError || !attempt) {
        return res.status(404).json({ error: 'Attempt not found' })
      }

      // Get questions to validate answers and determine correct options
      const { data: questions, error: questionsError } = await legacyAdmin
        .from('questions')
        .select('id, correct_option')
        .eq('course_id', (attempt.exams as any).course_id)

      if (questionsError) {
        console.error('Error fetching questions for emergency save:', questionsError)
        return res.status(500).json({ error: 'Failed to validate answers' })
      }

      const questionsMap = new Map(questions?.map(q => [q.id, q.correct_option]) || [])

      // Upsert all answers
      const upsertPromises = Object.entries(data.answers).map(([questionId, selectedOption]) => {
        const correctOption = questionsMap.get(questionId)
        if (!correctOption) return Promise.resolve()

        return legacyAdmin
          .from('exam_answers')
          .upsert({
            attempt_id: attemptId,
            question_id: questionId,
            selected_option: selectedOption as string,
            is_correct: (selectedOption as string) === correctOption
          }, {
            onConflict: 'attempt_id,question_id'
          })
      })

      await Promise.all(upsertPromises)

      // Log the emergency save event
      await legacyAdmin
        .from('audit_logs')
        .insert({
          action: 'emergency_save',
          user_id: null, // No user context in emergency save
          details: JSON.stringify({
            attemptId,
            answersCount: Object.keys(data.answers).length,
            currentIndex: data.currentIndex,
            remainingTime: data.remainingTime,
            timestamp: data.lastActivity
          }),
          ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          user_agent: req.headers['user-agent'],
          timestamp: new Date().toISOString()
        })
    }

    res.status(200).json({ success: true, message: 'Emergency save completed' })

  } catch (error) {
    console.error('Emergency save error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}