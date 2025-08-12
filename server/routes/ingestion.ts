import express from "express"
import ingestionService from "../services/ingestionService"
import { authenticate, authorize } from "../middleware/auth"

const router = express.Router()

// Get ingestion status for a document
router.get("/status/:documentId", authenticate, async (req, res) => {
  try {
    const status = await ingestionService.getIngestionStatus(req.params.documentId)

    res.json({
      success: true,
      data: status,
    })
  } catch (error) {
    console.error("Get ingestion status error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// Get all ingestion jobs (admin only)
router.get("/jobs", authenticate, authorize("admin"), async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit as string) || 50
    const jobs = await ingestionService.getAllIngestionJobs(limit)

    res.json({
      success: true,
      data: jobs,
    })
  } catch (error) {
    console.error("Get ingestion jobs error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

export default router
