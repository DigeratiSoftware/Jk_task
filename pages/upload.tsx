"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useMutation } from "react-query"
import { useAuth } from "../hooks/useAuth"
import Layout from "../components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { documentsApi } from "../lib/api"
import { Upload, FileText, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"

export default function UploadDocument() {
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const { user, isAuthenticated, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    } else if (!hasRole(["editor", "admin"])) {
      router.push("/dashboard")
      toast.error("You do not have permission to upload documents")
    }
  }, [isAuthenticated, hasRole, router])

  const uploadMutation = useMutation((formData: FormData) => documentsApi.uploadDocument(formData), {
    onSuccess: (response) => {
      toast.success("Document uploaded successfully!")
      router.push("/documents")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to upload document")
    },
  })

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (isValidFileType(droppedFile)) {
        setFile(droppedFile)
        if (!title) {
          setTitle(droppedFile.name.replace(/\.[^/.]+$/, ""))
        }
      } else {
        toast.error("Invalid file type. Please upload a text, PDF, or document file.")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (isValidFileType(selectedFile)) {
        setFile(selectedFile)
        if (!title) {
          setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""))
        }
      } else {
        toast.error("Invalid file type. Please upload a text, PDF, or document file.")
        e.target.value = ""
      }
    }
  }

  const isValidFileType = (file: File) => {
    const allowedTypes = [
      "text/plain",
      "text/markdown",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    return allowedTypes.includes(file.type)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast.error("Please select a file to upload")
      return
    }

    if (!title.trim()) {
      toast.error("Please enter a title for the document")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("title", title.trim())

    uploadMutation.mutate(formData)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (!isAuthenticated || !user || !hasRole(["editor", "admin"])) {
    return null
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload Document</h1>
          <p className="mt-2 text-gray-600">Upload a document to add it to your knowledge base for Q&A</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Document Upload
            </CardTitle>
            <CardDescription>Supported formats: TXT, MD, PDF, DOC, DOCX (Max size: 10MB)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload Area */}
              <div>
                <Label htmlFor="file">Document File</Label>
                <div
                  className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {file ? (
                    <div className="space-y-2">
                      <FileText className="h-12 w-12 text-blue-600 mx-auto" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)} • {file.type}
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => setFile(null)}>
                        Remove file
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-gray-600">
                          Drag and drop your file here, or{" "}
                          <label htmlFor="file" className="text-blue-600 hover:text-blue-500 cursor-pointer">
                            browse
                          </label>
                        </p>
                        <p className="text-sm text-gray-500">TXT, MD, PDF, DOC, DOCX up to 10MB</p>
                      </div>
                    </div>
                  )}
                  <input
                    id="file"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".txt,.md,.pdf,.doc,.docx"
                  />
                </div>
              </div>

              {/* Title Input */}
              <div>
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a descriptive title for your document"
                  className="mt-2"
                  required
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Processing Information</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Your document will be automatically processed for Q&A</li>
                        <li>Text will be chunked and embeddings will be generated</li>
                        <li>Processing may take a few minutes depending on document size</li>
                        <li>You can track the processing status in the documents page</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => router.push("/documents")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!file || !title.trim() || uploadMutation.isLoading}>
                  {uploadMutation.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
