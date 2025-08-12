"use client"

import { useEffect } from "react"
import { useRouter } from "next/router"
import { useQuery } from "react-query"
import { useAuth } from "../hooks/useAuth"
import Layout from "../components/Layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { documentsApi, qaApi, usersApi, ingestionApi } from "../lib/api"
import { FileText, MessageSquare, Users, Activity } from "lucide-react"

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  const { data: documentsData } = useQuery("dashboard-documents", () => documentsApi.getDocuments(1, 5), {
    enabled: isAuthenticated,
  })

  const { data: qaData } = useQuery("dashboard-qa", () => qaApi.getHistory(1, 5), { enabled: isAuthenticated })

  const { data: usersData } = useQuery("dashboard-users", () => usersApi.getUsers(1, 5), {
    enabled: isAuthenticated && user?.role === "admin",
  })

  const { data: ingestionData } = useQuery("dashboard-ingestion", () => ingestionApi.getAllJobs(10), {
    enabled: isAuthenticated && user?.role === "admin",
  })

  if (!isAuthenticated || !user) {
    return null
  }

  const documents = documentsData?.data.data?.documents || []
  const qaSessions = qaData?.data.data?.sessions || []
  const users = usersData?.data.data?.users || []
  const ingestionJobs = ingestionData?.data.data || []

  const stats = [
    {
      title: "Total Documents",
      value: documentsData?.data.data?.pagination?.total || 0,
      icon: FileText,
      description: "Documents uploaded",
    },
    {
      title: "Q&A Sessions",
      value: qaData?.data.data?.pagination?.total || 0,
      icon: MessageSquare,
      description: "Questions asked",
    },
    ...(user.role === "admin"
      ? [
          {
            title: "Total Users",
            value: usersData?.data.data?.pagination?.total || 0,
            icon: Users,
            description: "Registered users",
          },
        ]
      : []),
    {
      title: "Processing Jobs",
      value: ingestionJobs.filter((job: any) => job.status === "processing").length,
      icon: Activity,
      description: "Currently processing",
    },
  ]

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.firstName}!</h1>
          <p className="mt-2 text-gray-600">Here's what's happening with your documents and Q&A sessions.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Recent Documents
              </CardTitle>
              <CardDescription>Your latest uploaded documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.length > 0 ? (
                  documents.map((doc: any) => (
                    <div key={doc._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{doc.title}</h4>
                        <p className="text-sm text-gray-500">
                          {doc.filename} • {(doc.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            doc.ingestionStatus === "completed"
                              ? "bg-green-100 text-green-800"
                              : doc.ingestionStatus === "processing"
                                ? "bg-yellow-100 text-yellow-800"
                                : doc.ingestionStatus === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {doc.ingestionStatus}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No documents uploaded yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Q&A */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Recent Q&A Sessions
              </CardTitle>
              <CardDescription>Your latest questions and answers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {qaSessions.length > 0 ? (
                  qaSessions.map((session: any) => (
                    <div key={session._id} className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">{session.question}</h4>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{session.answer}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Confidence: {(session.confidence * 100).toFixed(0)}%</span>
                        <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No Q&A sessions yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Admin-only sections */}
          {user.role === "admin" && (
            <>
              {/* Recent Users */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Recent Users
                  </CardTitle>
                  <CardDescription>Latest registered users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.length > 0 ? (
                      users.map((user: any) => (
                        <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </h4>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full capitalize ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : user.role === "editor"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user.role}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No users found</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ingestion Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Ingestion Status
                  </CardTitle>
                  <CardDescription>Document processing status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ingestionJobs.length > 0 ? (
                      ingestionJobs.slice(0, 5).map((job: any) => (
                        <div key={job._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{job.documentId?.title || "Unknown Document"}</h4>
                            <p className="text-sm text-gray-500">Progress: {job.progress}%</p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              job.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : job.status === "processing"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : job.status === "failed"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {job.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No ingestion jobs found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
