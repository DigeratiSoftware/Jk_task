"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { useAuth } from "../hooks/useAuth"
import Layout from "../components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { documentsApi } from "../lib/api"
import { FileText, Search, Trash2, RefreshCw, Eye, Upload } from "lucide-react"
import toast from "react-hot-toast"
import Link from "next/link"

export default function Documents() {
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const { user, isAuthenticated, hasRole } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  const { data, isLoading, error } = useQuery(["documents", page], () => documentsApi.getDocuments(page, 10), {
    enabled: isAuthenticated,
  })

  const deleteDocumentMutation = useMutation((id: string) => documentsApi.deleteDocument(id), {
    onSuccess: () => {
      queryClient.invalidateQueries("documents")
      toast.success("Document deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete document")
    },
  })

  const triggerIngestionMutation = useMutation((id: string) => documentsApi.triggerIngestion(id), {
    onSuccess: () => {
      queryClient.invalidateQueries("documents")
      toast.success("Ingestion started")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to start ingestion")
    },
  })

  if (!isAuthenticated || !user) {
    return null
  }

  const documents = data?.data.data?.documents || []
  const pagination = data?.data.data?.pagination

  const filteredDocuments = documents.filter(
    (doc: any) =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.filename.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "processing":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
              <p className="mt-2 text-gray-600">Manage your uploaded documents and their processing status</p>
            </div>
            {hasRole(["editor", "admin"]) && (
              <Link href="/upload">
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </Link>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Document Library
            </CardTitle>
            <CardDescription>{pagination?.total || 0} documents total</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Documents Table */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading documents...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">Error loading documents</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? "No documents match your search" : "No documents uploaded yet"}
                </p>
                {hasRole(["editor", "admin"]) && !searchTerm && (
                  <Link href="/upload">
                    <Button className="mt-4">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload your first document
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Filename</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((document: any) => (
                      <TableRow key={document._id}>
                        <TableCell className="font-medium">{document.title}</TableCell>
                        <TableCell className="text-gray-500">{document.filename}</TableCell>
                        <TableCell className="text-gray-500">{formatFileSize(document.fileSize)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(document.ingestionStatus)}>{document.ingestionStatus}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {document.uploadedBy?.firstName} {document.uploadedBy?.lastName}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {new Date(document.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/documents/${document._id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>

                            {hasRole(["editor", "admin"]) && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => triggerIngestionMutation.mutate(document._id)}
                                  disabled={document.ingestionStatus === "processing"}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{document.title}"? This action cannot be
                                        undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteDocumentMutation.mutate(document._id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-700">
                  Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, pagination.total)} of {pagination.total} results
                </p>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
