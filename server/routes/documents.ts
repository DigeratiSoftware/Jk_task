import express from "express"
import multer from "multer"
import Document from "../models/Document"
import ingestionService from "../services/ingestionService"
import { authenticate, authorize } from "../middleware/auth"

const router = express.Router()

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow text files, PDFs, and documents
    const allowedTypes = [
      "text/plain",
      "text/markdown",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Invalid file type"))
    }
  },
})

// Get all documents
router.get("/", authenticate, async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page as string) || 1
    const limit = Number.parseInt(req.query.limit as string) || 10
    const skip = (page - 1) * limit

    const query: any = {}

    // If not admin, only show own documents
    if (req.user.role !== "admin") {
      query.uploadedBy = req.user._id
    }

    const documents = await Document.find(query)
      .populate("uploadedBy", "firstName lastName email")
      .select("-content -embeddings -chunks") // Exclude large fields
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Document.countDocuments(query)

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error("Get documents error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// Get document by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id).populate("uploadedBy", "firstName lastName email")

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      })
    }

    // Check permissions
    if (req.user.role !== "admin" && document.uploadedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    res.json({
      success: true,
      data: document,
    })
  } catch (error) {
    console.error("Get document error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// Upload document
router.post("/upload", authenticate, authorize("editor", "admin"), upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      })
    }

    const { title } = req.body
    const content = req.file.buffer.toString("utf-8")

    const document = new Document({
      title: title || req.file.originalname,
      content,
      filename: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user._id,
    })

    await document.save()

    // Start ingestion process asynchronously
    ingestionService.processDocument(document._id.toString()).catch((error) => {
      console.error("Ingestion error:", error)
    })

    res.status(201).json({
      success: true,
      data: document,
    })
  } catch (error) {
    console.error("Upload document error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during upload",
    })
  }
})

// Update document
router.patch("/:id", authenticate, authorize("editor", "admin"), async (req, res) => {
  try {
    const { title, content } = req.body

    const document = await Document.findById(req.params.id)

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      })
    }

    // Check permissions
    if (req.user.role !== "admin" && document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    const updateData: any = {}
    if (title) updateData.title = title
    if (content) {
      updateData.content = content
      updateData.ingestionStatus = "pending" // Reset ingestion status
    }

    const updatedDocument = await Document.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate(
      "uploadedBy",
      "firstName lastName email",
    )

    // If content was updated, restart ingestion
    if (content) {
      ingestionService.processDocument(document._id.toString()).catch((error) => {
        console.error("Ingestion error:", error)
      })
    }

    res.json({
      success: true,
      data: updatedDocument,
    })
  } catch (error) {
    console.error("Update document error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// Delete document
router.delete("/:id", authenticate, authorize("editor", "admin"), async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      })
    }

    // Check permissions
    if (req.user.role !== "admin" && document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    await Document.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Document deleted successfully",
    })
  } catch (error) {
    console.error("Delete document error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// Trigger ingestion
router.post("/:id/ingest", authenticate, authorize("editor", "admin"), async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      })
    }

    // Check permissions
    if (req.user.role !== "admin" && document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Start ingestion process
    ingestionService.processDocument(document._id.toString()).catch((error) => {
      console.error("Ingestion error:", error)
    })

    res.json({
      success: true,
      message: "Ingestion started",
    })
  } catch (error) {
    console.error("Trigger ingestion error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

export default router
