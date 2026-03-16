"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/stat-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, TrendingUp, Users, CheckCircle2, MapPin, Phone, DollarSign, AlertCircle } from "lucide-react"
import { useState } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

export default function AnalyticsPage() {
  const [selectedIssueIndex, setSelectedIssueIndex] = useState(0)
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<{
    name: string
    customers: Array<{ name: string; phone: string; amount: number; dueDate: string }>
  } | null>(null)

  const callVolumeData = [
    { day: "Monday", calls: 245, answered: 180, unanswered: 65 },
    { day: "Tuesday", calls: 278, answered: 195, unanswered: 83 },
    { day: "Wednesday", calls: 262, answered: 188, unanswered: 74 },
    { day: "Thursday", calls: 289, answered: 210, unanswered: 79 },
    { day: "Friday", calls: 198, answered: 145, unanswered: 53 },
    { day: "Saturday", calls: 234, answered: 172, unanswered: 62 },
    { day: "Sunday", calls: 256, answered: 189, unanswered: 67 },
  ]

  const paymentStatusData = [
    {
      name: "Satisfied with Service",
      value: 542,
      color: "#059669",
      customers: [
        { name: "Ahmed Al-Ghamdi", phone: "+966 5123 4567", amount: 45.5, dueDate: "2024-01-15" },
        { name: "Fatima Al-Otaibi", phone: "+966 5234 5678", amount: 67.2, dueDate: "2024-01-14" },
        { name: "Saeed Al-Qahtani", phone: "+966 5345 6789", amount: 34.8, dueDate: "2024-01-16" },
      ],
    },
    {
      name: "Needs Follow-up",
      value: 234,
      color: "#0891b2",
      customers: [
        { name: "Khalid Al-Harbi", phone: "+966 5456 7890", amount: 89.3, dueDate: "2024-01-20" },
        { name: "Mariam Al-Shehri", phone: "+966 5567 8901", amount: 52.6, dueDate: "2024-01-22" },
      ],
    },
    {
      name: "No Answer",
      value: 467,
      color: "#d97706",
      customers: [
        { name: "Ali Al-Dosari", phone: "+966 5678 9012", amount: 120.5, dueDate: "2024-01-10" },
        { name: "Salem Al-Zahrani", phone: "+966 5789 0123", amount: 78.9, dueDate: "2024-01-12" },
        { name: "Noura Al-Shamari", phone: "+966 5890 1234", amount: 95.4, dueDate: "2024-01-11" },
      ],
    },
    {
      name: "Unsatisfied",
      value: 145,
      color: "#dc2626",
      customers: [
        { name: "Mohammed Al-Mutairi", phone: "+966 5901 2345", amount: 156.7, dueDate: "2024-01-08" },
        { name: "Aisha Al-Enezi", phone: "+966 5012 3456", amount: 203.2, dueDate: "2024-01-09" },
      ],
    },
  ]

  const regionalDistribution = [
    { region: "Doha", calls: 542 },
    { region: "Al Wakrah", calls: 367 },
    { region: "Al Khor", calls: 334 },
    { region: "Lusail", calls: 298 },
    { region: "Al Rayyan", calls: 276 },
    { region: "Umm Salal", calls: 245 },
    { region: "Al Daayen", calls: 189 },
  ]

  const commonIssuesData = [
    { issue: "General Inquiry", count: 86 },
    { issue: "Service Booking", count: 64 },
    { issue: "Service Follow-up", count: 52 },
    { issue: "Parts Inquiry", count: 38 },
    { issue: "Complaint", count: 28 },
  ]

  const detailedIssuesData = [
    {
      issue: "General Inquiries",
      solutions: [
        { solution: "Direct Answer", count: 124 },
        { solution: "Transfer to Advisor", count: 98 },
        { solution: "Schedule Visit", count: 67 },
        { solution: "Send Information", count: 45 },
      ],
    },
    {
      issue: "Service Booking",
      solutions: [
        { solution: "Booked Successfully", count: 156 },
        { solution: "Waitlisted", count: 89 },
        { solution: "Rescheduled", count: 67 },
        { solution: "Cancelled", count: 30 },
      ],
    },
    {
      issue: "Service Follow-up",
      solutions: [
        { solution: "Customer Satisfied", count: 98 },
        { solution: "Needs Further Service", count: 76 },
        { solution: "Referred to Specialist", count: 45 },
        { solution: "Warranty Approved", count: 15 },
      ],
    },
    {
      issue: "Parts Inquiry",
      solutions: [
        { solution: "Parts Available", count: 112 },
        { solution: "Parts On Order", count: 87 },
        { solution: "Needs Inspection", count: 54 },
        { solution: "Follow-up Scheduled", count: 32 },
      ],
    },
    {
      issue: "Complaints",
      solutions: [
        { solution: "Immediate Resolution", count: 78 },
        { solution: "Escalate to Management", count: 45 },
        { solution: "Follow-up Later", count: 34 },
        { solution: "Service Recovery", count: 12 },
      ],
    },
  ]

  const selectedIssue = detailedIssuesData[selectedIssueIndex]

  const handlePieClick = (data: any) => {
    setSelectedPaymentStatus(data)
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-sans text-3xl font-bold text-foreground">Alfardan Service Analytics</h1>
            <p className="mt-1 font-sans text-sm text-muted-foreground">
              Comprehensive insights and performance metrics for Alfardan service center operations
            </p>
          </div>
          <Select defaultValue="7days">
            <SelectTrigger className="w-[180px] font-sans">
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Calls" value="1,762" change="+15.3% vs last week" changeType="positive" icon={Phone} />
          <StatCard
            title="Customer Satisfaction Rate"
            value="92.7%"
            change="+4.1% improvement"
            changeType="positive"
            icon={CheckCircle2}
          />
          <StatCard title="Average Call Duration" value="4:32" change="minutes" changeType="positive" icon={Clock} />
          <StatCard title="Answer Rate" value="88.5%" change="+8.2% increase" changeType="positive" icon={TrendingUp} />
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="font-sans text-xl font-semibold text-card-foreground">
                Daily Collection Calls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={callVolumeData} margin={{ top: 20, right: 40, left: 20, bottom: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis
                    dataKey="day"
                    stroke="#aaa"
                    style={{ fontSize: "20px", fontWeight: 700 }}
                    angle={-35}
                    textAnchor="end"
                    height={110}
                    interval={0}
                  />
                  <YAxis stroke="#aaa" style={{ fontSize: "20px", fontWeight: 700 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #444",
                      borderRadius: "8px",
                      fontSize: "18px",
                    }}
                    labelStyle={{ color: "#fff", fontWeight: 700, fontSize: "20px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "20px", fontWeight: 700, paddingTop: "40px" }} />
                  <Bar dataKey="answered" fill="#10b981" name="Answered" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="unanswered" fill="#f59e0b" name="No Answer" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="font-sans text-xl font-semibold text-card-foreground">Payment Status</CardTitle>
              <p className="mt-1 font-sans text-sm text-muted-foreground">Click any section to view customer list</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={450}>
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={{
                      stroke: "#666",
                      strokeWidth: 2,
                      length: 60,
                    }}
                    label={({ name, percent, cx, cy, midAngle, outerRadius, index }) => {
                      const RADIAN = Math.PI / 180
                      const radius = outerRadius + 60
                      const x = cx + radius * Math.cos(-midAngle * RADIAN)
                      const y = cy + radius * Math.sin(-midAngle * RADIAN)
                      const textAnchor = x > cx ? "start" : "end"

                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#000000"
                          textAnchor={textAnchor}
                          dominantBaseline="central"
                          style={{ fontSize: "16px", fontWeight: 700 }}
                        >
                          {`${name}: ${(percent * 100).toFixed(0)}%`}
                        </text>
                      )
                    }}
                    outerRadius={140}
                    innerRadius={80}
                    dataKey="value"
                    onClick={(data) => handlePieClick(data)}
                    style={{ cursor: "pointer" }}
                  >
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #444",
                      borderRadius: "8px",
                      fontSize: "16px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Dialog open={!!selectedPaymentStatus} onOpenChange={() => setSelectedPaymentStatus(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-sans text-2xl font-bold flex items-center gap-2">
                {selectedPaymentStatus?.name === "Payment Complete" && (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                )}
                {selectedPaymentStatus?.name === "Payment Promise" && <Clock className="h-6 w-6 text-blue-500" />}
                {selectedPaymentStatus?.name === "No Answer" && <Phone className="h-6 w-6 text-orange-500" />}
                {selectedPaymentStatus?.name === "Payment Declined" && <AlertCircle className="h-6 w-6 text-red-500" />}
                {selectedPaymentStatus?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {selectedPaymentStatus?.customers.map((customer, index) => (
                <Card key={index} className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-sans font-semibold text-lg">{customer.name}</h3>
                        <p className="font-sans text-sm text-muted-foreground flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {customer.phone}
                        </p>
                        <p className="font-sans text-sm text-muted-foreground">
                          Due Date: {new Date(customer.dueDate).toLocaleDateString("en-US")}
                        </p>
                      </div>
                      <Badge variant="outline" className="font-sans text-lg font-bold">
                        {customer.amount.toFixed(2)} SAR
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="font-sans text-xl font-semibold text-card-foreground">
                Geographic Distribution of Collection Calls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={regionalDistribution} layout="vertical" margin={{ left: 60, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#374151" style={{ fontSize: "14px" }} />
                  <YAxis
                    type="category"
                    dataKey="region"
                    stroke="#374151"
                    style={{ fontSize: "16px", fontWeight: 600, fill: "#000" }}
                    width={80}
                    tick={{ fill: "#000" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                    formatter={(value: number) => [`${value} calls`, "Number of Calls"]}
                  />
                  <Bar dataKey="calls" radius={[0, 8, 8, 0]} fill="#b8860b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="font-sans text-xl font-semibold text-card-foreground flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Common Collection Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={450}>
                <LineChart data={commonIssuesData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis
                    dataKey="issue"
                    stroke="#aaa"
                    style={{ fontSize: "16px", fontWeight: 600 }}
                    angle={-35}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#aaa"
                    style={{ fontSize: "16px", fontWeight: 600 }}
                    label={{
                      value: "Number of Cases",
                      angle: -90,
                      position: "insideLeft",
                      style: { fontSize: "16px" },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #444",
                      borderRadius: "8px",
                      fontSize: "16px",
                    }}
                    labelStyle={{ color: "#fff", fontWeight: 600, fontSize: "16px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6", r: 6 }}
                    activeDot={{ r: 8 }}
                    name="Number of Cases"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 bg-card">
          <CardHeader>
            <CardTitle className="font-sans text-2xl font-semibold text-card-foreground flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              Collection Scenarios and Applied Solutions
            </CardTitle>
            <p className="mt-2 font-sans text-sm text-muted-foreground">
              Select a collection scenario to view the chart of solution distribution
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="font-sans text-sm font-medium text-foreground">Select Collection Scenario:</label>
              <Select
                value={selectedIssueIndex.toString()}
                onValueChange={(value) => setSelectedIssueIndex(Number.parseInt(value))}
              >
                <SelectTrigger className="w-full font-sans text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {detailedIssuesData.map((item, index) => (
                    <SelectItem key={index} value={index.toString()} className="font-sans text-base">
                      {item.issue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  {selectedIssueIndex + 1}
                </div>
                <h3 className="font-sans text-lg font-semibold text-foreground pt-1">{selectedIssue.issue}</h3>
              </div>
              <div className="pl-11">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={selectedIssue.solutions} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis
                      dataKey="solution"
                      stroke="#000"
                      style={{ fontSize: "16px", fontWeight: 600, fill: "#000", opacity: 1 }}
                      angle={-35}
                      textAnchor="end"
                      height={100}
                      interval={0}
                      tick={{ fill: "#000", opacity: 1 }}
                    />
                    <YAxis
                      domain={[0, 180]}
                      stroke="#000"
                      style={{ fontSize: "16px", fontWeight: 600, fill: "#000", opacity: 1 }}
                      tick={{ fill: "#000", opacity: 1 }}
                      label={{
                        value: "Number of Cases",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: "16px", fill: "#000", opacity: 1 },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #444",
                        borderRadius: "8px",
                        fontSize: "16px",
                      }}
                      labelStyle={{ color: "#fff", fontWeight: 600, fontSize: "16px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: "#10b981", r: 6 }}
                      activeDot={{ r: 8 }}
                      name="Number of Cases"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="Peak Collection Time"
            value="11:00 AM"
            description="Highest call response rate"
            icon={Clock}
          />
          <StatCard
            title="Total Followed-Up Customers"
            value="1,388"
            change="+213 this week"
            changeType="positive"
            icon={Users}
          />
          <StatCard
            title="Covered Regions"
            value="11 Governorates"
            change="Comprehensive Coverage"
            changeType="positive"
            icon={MapPin}
          />
        </div>
      </main>
    </div>
  )
}
