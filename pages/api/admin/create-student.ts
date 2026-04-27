// pages/api/admin/create-student.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { legacyAdmin } from '../../../lib/legacyAdmin'
import { legacyClient } from '../../../lib/legacyClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      email,
      password,
      firstName,
      lastName,
      fatherName,
      motherName,
      gender,
      dob,
      phone,
      address,
      city,
      state,
      country,
      pincode,
      category,
      lastQualification,
      username,
      enrollmentNo,
      fees,
      paymentMode,
      photoUrl
    } = req.body

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const fullName = `${firstName} ${lastName}`

    // 1 Create user with Admin API (auto-confirms email)
    const { data: authData, error: authError } = await legacyAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email!
      user_metadata: {
        full_name: fullName,
        role: 'student'
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return res.status(400).json({ error: authError.message })
    }

    if (!authData.user) {
      return res.status(400).json({ error: 'Failed to create user' })
    }

    const userId = authData.user.id

    // 2 Create profile
    const { error: profileError } = await legacyAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        email: email,
        role: 'student'
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      // Continue anyway, profile might be created by trigger
    }

    // 3 Create student record
    const { error: studentError } = await legacyAdmin
      .from('students')
      .insert({
        profile_id: userId,
        enrollment_no: enrollmentNo,
        first_name: firstName,
        last_name: lastName,
        father_name: fatherName || null,
        mother_name: motherName || null,
        gender: gender || 'Male',
        dob: dob || null,
        phone: phone || null,
        email: email,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || 'India',
        pincode: pincode || null,
        category: category || null,
        last_qualification: lastQualification || null,
        username: username || null,
        fees: fees || 500,
        payment_mode: paymentMode || null,
        photo_url: photoUrl || null,
        status: 'approved'
      })

    if (studentError) {
      console.error('Student error:', studentError)
      return res.status(400).json({ error: 'Failed to create student: ' + studentError.message })
    }

    return res.status(200).json({
      success: true,
      message: `Student "${fullName}" created successfully!`,
      enrollmentNo: enrollmentNo,
      username: username
    })

  } catch (error: any) {
    console.error('Server error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
