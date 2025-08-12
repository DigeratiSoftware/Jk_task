"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useQuery, useMutation, useQueryClient } from "react-query"
import { useAuth } from "../hooks/useAuth"
import Layout from "../components/Layout"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { qaApi, documentsApi } from "../lib/api"
import { MessageSquare, Send, FileText, Clock, TrendingUp } from "lucide-react"
import toast from "react-hot-toast"

export default function QA() {
  const [question, setQuestion] = useState("")
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [currentAnswer, setCurrentAnswer] = useState<any>(null)
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  const { data: documentsData } = useQuery("qa-documents", () => documentsApi.getDocuments(1, 100), {
    enabled: isAuthenticated,
  })

  const { data: historyData, isLoading: historyLoading } = useQuery("qa-history", () => qaApi.getHistory(1, 20), {
    enabled: isAuthenticated,
  })

  const askQuestionMutation = useMutation(
    ({ question, documentIds }: { question: string; documentIds?: string[] }) =>
      qaApi.askQuestion(question, documentIds),
    {
      onSuccess: (response) => {
        setCurrentAnswer(response.data.data)
        setQuestion("")
        queryClient.invalidateQueries("qa-history")
        toast.success("Question answered successfully!")
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to get answer")
      },
    },
  )

  if (!isAuthenticated || !user) {
    return null
  }

  const documents = documentsData?.data.data?.documents?.filter((doc: any) => doc.ingestionStatus === "completed") || []
  const history = historyData?.data.data?.sessions || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!question.trim()) {
      toast.error("Please enter a question")
      return
    }

    askQuestionMutation.mutate({
      question: question.trim(),
      documentIds: selectedDocuments.length > 0 ? selectedDocuments : undefined,
    })
  }

  const handleDocumentToggle = (documentId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(documentId) ? prev.filter((id) => id !== documentId) : [...prev, documentId],
    )
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800"
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Q&A Assistant</h1>
          <p className="mt-2 text-gray-600">Ask questions about your documents and get AI-powered answers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Ask a Question
                </CardTitle>
                <CardDescription>Get answers based on your uploaded documents</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Textarea
                      placeholder="What would you like to know about your documents?"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      {selectedDocuments.length > 0
                        ? `Searching in ${selectedDocuments.length} selected document(s)`
                        : "Searching in all documents"}
                    </p>
                    <Button type="submit" disabled={!question.trim() || askQuestionMutation.isLoading}>
                      {askQuestionMutation.isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Thinking...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Ask Question
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                {/* Current Answer */}
                {currentAnswer && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-blue-900">Latest Answer</h3>
                      <Badge className={getConfidenceColor(currentAnswer.confidence)}>
                        {(currentAnswer.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-gray-900 mb-2">Q: {currentAnswer.question}</p>
                        <p className="text-gray-700 leading-relaxed">{currentAnswer.answer}</p>
                      </div>
                      {currentAnswer.relevantDocuments.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Sources:</p>
                          <div className="flex flex-wrap gap-1">
                            {currentAnswer.relevantDocuments.map((docId: string) => {
                              const doc = documents.find((d: any) => d._id === docId)
                              return doc ? (
                                <Badge key={docId} variant="outline" className="text-xs">
                                  {doc.title}
                                </Badge>
                              ) : null
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Q&A History */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Questions
                </CardTitle>
                <CardDescription>Your Q&A history</CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading history...</p>
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No questions asked yet</p>
                ) : (
                  <div className="space-y-4">
                    {history.map((session: any) => (
                      <div key={session._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 flex-1">{session.question}</h4>
                          <Badge className={getConfidenceColor(session.confidence)}>
                            {(session.confidence * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        <p className="text-gray-700 text-sm mb-3 leading-relaxed">{session.answer}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            {new Date(session.createdAt).toLocaleDateString()} at{" "}
                            {new Date(session.createdAt).toLocaleTimeString()}
                          </span>
                          {session.relevantDocuments.length > 0 && (
                            <span>{session.relevantDocuments.length} source(s)</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Document Selection Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Document Selection
                </CardTitle>
                <CardDescription>Choose specific documents to search (optional)</CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No processed documents available. Upload and process documents first.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{documents.length} document(s) available</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDocuments([])}
                        disabled={selectedDocuments.length === 0}
                      >
                        Clear all
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {documents.map((document: any) => (
                        <div key={document._id} className="flex items-start space-x-2">
                          <Checkbox
                            id={document._id}
                            checked={selectedDocuments.includes(document._id)}
                            onCheckedChange={() => handleDocumentToggle(document._id)}
                          />
                          <label htmlFor={document._id} className="text-sm cursor-pointer flex-1">
                            <div className="font-medium text-gray-900">{document.title}</div>
                            <div className="text-gray-500 text-xs">
                              {document.filename} • {new Date(document.createdAt).toLocaleDateString()}
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Your Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Questions</span>
                    <span className="font-medium">{historyData?.data.data?.pagination?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Available Documents</span>
                    <span className="font-medium">{documents.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Selected Documents</span>
                    <span className="font-medium">{selectedDocuments.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}
