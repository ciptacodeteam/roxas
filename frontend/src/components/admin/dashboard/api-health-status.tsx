import { AlertTriangle, Wifi, WifiOff, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ApiHealth } from "@/lib/dashboard";
import { formatTimeAgo } from "@/lib/date-utils";

interface ApiHealthStatusProps {
  apiHealth: ApiHealth;
}

export function ApiHealthStatus({ apiHealth }: ApiHealthStatusProps) {
  const getStatusIcon = (status: string) => {
    if (status === "healthy") return <Wifi className="h-5 w-5 text-green-400" />;
    if (status === "degraded") return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
    return <WifiOff className="h-5 w-5 text-gray-400" />;
  };

  const getStatusBgClass = (status: string) => {
    if (status === "healthy") return "bg-green-500/20";
    if (status === "degraded") return "bg-yellow-500/20";
    return "bg-gray-500/20";
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === "healthy") return "bg-green-600/20 text-green-400";
    if (status === "degraded") return "bg-yellow-600/20 text-yellow-400";
    return "bg-gray-600/20 text-gray-400";
  };

  const getStatusLabel = (status: string) => {
    if (status === "healthy") return "Healthy";
    if (status === "degraded") return "Degraded";
    return "Unknown";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4" />
              API Integration Status
            </CardTitle>
            <CardDescription>
              Real-time status of external API connections (last 24 hours)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Digiflazz Status */}
          <div className="flex items-center gap-4 rounded-lg border p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getStatusBgClass(apiHealth.digiflazz.status)}`}>
              {getStatusIcon(apiHealth.digiflazz.status)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Digiflazz</span>
                <Badge variant="outline" className={getStatusBadgeClass(apiHealth.digiflazz.status)}>
                  {getStatusLabel(apiHealth.digiflazz.status)}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-3 text-sm text-gray-400">
                <span>{apiHealth.digiflazz.successRate}% success</span>
                <span>•</span>
                <span>{apiHealth.digiflazz.total} calls</span>
                {apiHealth.digiflazz.avgResponseTime > 0 && (
                  <>
                    <span>•</span>
                    <span>{apiHealth.digiflazz.avgResponseTime}ms avg</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Midtrans Status */}
          <div className="flex items-center gap-4 rounded-lg border p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getStatusBgClass(apiHealth.midtrans.status)}`}>
              {getStatusIcon(apiHealth.midtrans.status)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Midtrans</span>
                <Badge variant="outline" className={getStatusBadgeClass(apiHealth.midtrans.status)}>
                  {getStatusLabel(apiHealth.midtrans.status)}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-3 text-sm text-gray-400">
                <span>{apiHealth.midtrans.successRate}% success</span>
                <span>•</span>
                <span>{apiHealth.midtrans.total} calls</span>
                {apiHealth.midtrans.avgResponseTime > 0 && (
                  <>
                    <span>•</span>
                    <span>{apiHealth.midtrans.avgResponseTime}ms avg</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mailgun Status */}
          <div className="flex items-center gap-4 rounded-lg border p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getStatusBgClass(apiHealth.mailgun.status)}`}>
              {getStatusIcon(apiHealth.mailgun.status)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Mailgun</span>
                <Badge variant="outline" className={getStatusBadgeClass(apiHealth.mailgun.status)}>
                  {getStatusLabel(apiHealth.mailgun.status)}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-3 text-sm text-gray-400">
                <span>{apiHealth.mailgun.successRate}% success</span>
                <span>•</span>
                <span>{apiHealth.mailgun.total} calls</span>
                {apiHealth.mailgun.avgResponseTime > 0 && (
                  <>
                    <span>•</span>
                    <span>{apiHealth.mailgun.avgResponseTime}ms avg</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent API Errors */}
        {apiHealth.recentErrors && apiHealth.recentErrors.length > 0 && (
          <div className="mt-4">
            <h4 className="mb-2 text-sm font-medium text-gray-400">Recent API Errors (last hour)</h4>
            <div className="space-y-2">
              {apiHealth.recentErrors.slice(0, 3).map((error) => (
                <div key={error.id} className="flex items-center gap-2 rounded bg-red-500/10 px-3 py-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="font-medium text-red-400">{error.provider}</span>
                  <span className="text-gray-400">-</span>
                  <span className="flex-1 truncate text-gray-300">{error.errorMessage || error.endpoint}</span>
                  <span className="text-gray-500">{formatTimeAgo(error.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
