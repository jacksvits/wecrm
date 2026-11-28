// Подавление уведомлений, пока соответствующая переписка открыта на экране.
// TaskDetail регистрирует просматриваемое обсуждение задачи, GlobalChat — открытый
// общий чат. Пока контекст активен и вкладка браузера видима и в фокусе,
// useNotifications не показывает такие уведомления (без звука, без попадания
// в список колокольчика и счётчик — сообщение и так сразу приходит в открытый
// чат через realtime-широковещание), а GlobalChat не играет звук новых сообщений.

const viewingTaskDiscussions = new Set<string>();
let viewingGlobalChatCount = 0;

// Просматриваемый контекст глушит уведомления только когда пользователь
// действительно смотрит на экран: вкладка видима и окно в фокусе.
// В свёрнутой вкладке или другом окне звук/счётчик работают как обычно.
function isActuallyViewing(): boolean {
  if (typeof document === 'undefined') return false;
  return document.visibilityState === 'visible' && document.hasFocus();
}

// Регистрирует просматриваемое обсуждение задачи; возвращает функцию остановки
export function startViewingTaskDiscussion(taskId: string): () => void {
  viewingTaskDiscussions.add(taskId);
  return () => {
    viewingTaskDiscussions.delete(taskId);
  };
}

// Регистрирует открытый общий чат; возвращает функцию остановки
export function startViewingGlobalChat(): () => void {
  viewingGlobalChatCount += 1;
  return () => {
    viewingGlobalChatCount = Math.max(0, viewingGlobalChatCount - 1);
  };
}

// Пока общий чат открыт на экране — звук новых сообщений в нём не играем:
// пользователь видит сообщение сразу, как и в мессенджерах
export function isGlobalChatSoundMuted(): boolean {
  return viewingGlobalChatCount > 0 && isActuallyViewing();
}

// Уведомление о комментарии в обсуждении задачи, которое пользователь
// прямо сейчас смотрит на экране, — не показываем совсем
export function isNotificationSuppressed(notification: {
  type?: string;
  entityType?: string | null;
  entityId?: string | null;
}): boolean {
  if (!isActuallyViewing()) return false;
  if (
    notification.type === 'comment' &&
    notification.entityType === 'task' &&
    notification.entityId &&
    viewingTaskDiscussions.has(notification.entityId)
  ) {
    return true;
  }
  return false;
}
