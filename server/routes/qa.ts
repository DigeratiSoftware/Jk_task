import express from "express"
import QASession from "../models/QASession"
import ragService from "../services/ragService"
import { authenticate } from "../middleware/auth"

const router = express.Router()

// Ask a question
router.post("/ask", authenticate, async (req, res) => {
  try {
    const { question, documentIds } = req.body

    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      })
    }

    // Get answer using RAG
    const { answer, confidence, relevantDocuments } = await ragService.askQuestion(question, documentIds)

    // Save Q&A session
    const qaSession = new QASession({
      userId: req.user._id,
      question,
      answer,
      relevantDocuments,
      confidence,
    })

    await qaSession.save()

    res.json({
      success: true,
      data: {
        question,
        answer,
        confidence,
        relevantDocuments,
        sessionId: qaSession._id,
      },
    })
  } catch (error) {
    console.error("Q&A error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during Q&A",
    })
  }
})

// Get Q&A history
router.get("/history", authenticate, async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page as string) || 1
    const limit = Number.parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    const sessions = await QASession.find({ userId: req.user._id })
      .populate("relevantDocuments", "title filename")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await QASession.countDocuments({ userId: req.user._id })

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error("Get Q&A history error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// Get Q&A session by ID
router.get("/session/:id", authenticate, async (req, res) => {
  try {
    const session = await QASession.findById(req.params.id)
      .populate("relevantDocuments", "title filename")
      .populate("userId", "firstName lastName email")

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      })
    }

    // Check permissions
    if (req.user.role !== "admin" && session.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    res.json({
      success: true,
      data: session,
    })
  } catch (error) {
    console.error("Get Q&A session error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

export default router
