"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"

interface ConnectionStatus {
  isConnected: boolean
  isLoading: boolean
  error?: string
  details?: string
}

export function HamsaConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isLoading: true,
  })
  const [showDetails, setShowDetails] = useState(false)

  const checkConnection = async () => {
    setStatus({ isConnected: false, isLoading: true })

    try {
      const response = await fetch("/api/hamsa/status")

      const data = await response.json()

      if (response.ok && data.connected) {
        setStatus({
          isConnected: true,
          isLoading: false,
        })
      } else {
        setStatus({
          isConnected: false,
          isLoading: false,
          error: data.message || "Connection failed",
        })
      }
    } catch (error) {
      setStatus({
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {status.isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : status.isConnected ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            <div className="flex-1">
              <p className="font-sans text-sm font-medium text-foreground">
                {status.isLoading
                  ? "Connecting to HHC system..."
                  : status.isConnected
                    ? "Connected to Shaffra AI Cloud"
                    : "Connection Failed"}
              </p>
              {status.error && (
                <div className="mt-1 space-y-1">
                  <p className="font-sans text-xs text-destructive">{status.error}</p>
                  {status.details && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setShowDetails(!showDetails)}
                    >
                      {showDetails ? "Hide" : "Show"} technical details
                    </Button>
                  )}
                  {showDetails && status.details && (
                    <div className="mt-2 rounded-md bg-muted p-2">
                      <p className="font-mono text-xs text-muted-foreground break-all">{status.details}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={status.isConnected ? "default" : "destructive"} className="font-sans text-xs">
              {status.isConnected ? "Live" : "Offline"}
            </Badge>
            <Button size="sm" variant="ghost" onClick={checkConnection} disabled={status.isLoading}>
              <RefreshCw className={`h-4 w-4 ${status.isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        {!status.isConnected && !status.isLoading && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-warning/50 bg-warning/10 p-3">
            <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <p className="font-sans text-xs font-medium text-warning">Configuration Required:</p>
              <ol className="font-sans text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Ensure HAMSA_API_KEY is set in environment variables</li>
                <li>Verify HAMSA_PROJECT_ID is configured</li>
                <li>Check that Hamsa API base URL is accessible</li>
                <li>Publish changes to apply updates</li>
              </ol>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
