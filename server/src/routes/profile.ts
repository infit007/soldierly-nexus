import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { AuthenticatedRequest } from '../types/index.js'
import { supabase } from '../db.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const userId = (req as AuthenticatedRequest).auth.userId
    const section = req.body.section
    const timestamp = Date.now()
    const ext = path.extname(file.originalname)
    cb(null, `${userId}_${section}_${timestamp}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 300 * 1024, // 300KB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'))
    }
  }
})

// Get user profile
router.get('/profile', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth.userId
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    res.json(profile || {})
  } catch (e) {
    console.error('Get profile error:', e)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Update personal details
router.put('/personal', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth.userId
    const data = req.body
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        personal_details: data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
    if (error) throw error
    res.json({ ok: true })
  } catch (e) {
    console.error('Update personal details error:', e)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Update family details
router.put('/family', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth.userId
    const data = req.body
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        family: data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
    if (error) throw error
    res.json({ ok: true })
  } catch (e) {
    console.error('Update family details error:', e)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Update education details
router.put('/education', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth.userId
    const data = req.body
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        education: data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
    if (error) throw error
    res.json({ ok: true })
  } catch (e) {
    console.error('Update education details error:', e)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Update medical details
router.put('/medical', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth.userId
    const data = req.body
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        medical: data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
    if (error) throw error
    res.json({ ok: true })
  } catch (e) {
    console.error('Update medical details error:', e)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Update others details
router.put('/others', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth.userId
    const data = req.body
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        others: data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
    if (error) throw error
    res.json({ ok: true })
  } catch (e) {
    console.error('Update others details error:', e)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Upload document
router.post('/documents', requireAuth, upload.single('file'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth.userId
    const section = req.body.section
    const file = req.file

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    if (!section) {
      return res.status(400).json({ error: 'Section is required' })
    }

    // Get current documents
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('documents')
      .eq('user_id', userId)
      .single()

    const currentDocuments = (profile?.documents as Record<string, any>) || {}
    
    // Add new document
    const newDocument = {
      name: file.originalname,
      filename: file.filename,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      path: file.path
    }

    const updatedDocuments = {
      ...currentDocuments,
      [section]: newDocument
    }

    // Update profile with new document
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        documents: updatedDocuments,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
    if (error) throw error

    res.json({ ok: true, document: newDocument })
  } catch (e) {
    console.error('Upload document error:', e)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Remove document
router.delete('/documents/:section', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth.userId
    const section = req.params.section

    // Get current documents
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('documents')
      .eq('user_id', userId)
      .single()

    if (!profile?.documents) {
      return res.status(404).json({ error: 'No documents found' })
    }

    const currentDocuments = profile.documents as any
    const documentToRemove = currentDocuments[section]

    if (!documentToRemove) {
      return res.status(404).json({ error: 'Document not found' })
    }

    // Remove file from filesystem
    try {
      if (fs.existsSync(documentToRemove.path)) {
        fs.unlinkSync(documentToRemove.path)
      }
    } catch (fileError) {
      console.error('Error removing file:', fileError)
    }

    // Remove from database
    const updatedDocuments = { ...currentDocuments }
    delete updatedDocuments[section]

    const { error } = await supabase
      .from('user_profiles')
      .update({
        documents: updatedDocuments,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
    if (error) throw error

    res.json({ ok: true })
  } catch (e) {
    console.error('Remove document error:', e)
    res.status(500).json({ error: 'Internal error' })
  }
})

// Download document
router.get('/documents/:section', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth.userId
    const section = req.params.section

    // Get document info
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('documents')
      .eq('user_id', userId)
      .single()

    if (!profile?.documents) {
      return res.status(404).json({ error: 'No documents found' })
    }

    const documents = profile.documents as any
    const document = documents[section]

    if (!document) {
      return res.status(404).json({ error: 'Document not found' })
    }

    // Check if file exists
    if (!fs.existsSync(document.path)) {
      return res.status(404).json({ error: 'File not found' })
    }

    // Send file
    res.download(document.path, document.name)
  } catch (e) {
    console.error('Download document error:', e)
    res.status(500).json({ error: 'Internal error' })
  }
})

export default router


