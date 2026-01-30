import { AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationBannerProps {
  notifications: {
    failedTransactions: number;
    pendingAttention: number;
  };
  onViewFailed: () => void;
  onViewPending: () => void;
}

export function NotificationBanner({
  notifications,
  onViewFailed,
  onViewPending,
}: NotificationBannerProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {notifications.failedTransactions > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-red-400">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">
            {notifications.failedTransactions} failed transaction(s) this month
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-7 text-red-400 hover:bg-red-500/20 hover:text-red-300"
            onClick={onViewFailed}
          >
            View
          </Button>
        </div>
      )}
      {notifications.pendingAttention > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 px-4 py-2 text-yellow-400">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">
            {notifications.pendingAttention} pending order(s) need attention
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-7 text-yellow-400 hover:bg-yellow-500/20 hover:text-yellow-300"
            onClick={onViewPending}
          >
            View
          </Button>
        </div>
      )}
    </div>
  );
}
