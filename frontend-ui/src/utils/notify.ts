import { toast } from "sonner";
import { useNotificationStore, NotificationType } from "@/store/notificationStore";
/**
 * Utility to trigger both a Sonner toast and add a notification log.
 */
export const notify = (title: string, message: string, type: NotificationType = "info") => {
  switch (type) {
    case "success":
      toast.success(title, { description: message });
      break;
    case "error":
      toast.error(title, { description: message });
      break;
    case "info":
      toast.info(title, { description: message });
      break;
    case "warning":
      toast.warning(title, { description: message });
      break;
    default:
      toast(title, { description: message });
  }
  useNotificationStore.getState().addNotification({
    title,
    message,
    type,
  });
};
