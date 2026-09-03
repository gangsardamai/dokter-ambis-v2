"use client";

import { useEffect } from "react";

import { markLessonMessageThreadReadAction } from "@/app/actions/lesson-message.actions";

interface ThreadReadTrackerProps {
  threadId: string;
  readThrough: string;
}

export default function ThreadReadTracker({
  threadId,
  readThrough,
}: ThreadReadTrackerProps) {
  useEffect(() => {
    let active = true;

    void markLessonMessageThreadReadAction(threadId, readThrough).then((unreadCount) => {
      if (!active) return;
      window.dispatchEvent(
        new CustomEvent("dashboard-message-unread-count", {
          detail: unreadCount,
        }),
      );
    });

    return () => {
      active = false;
    };
  }, [readThrough, threadId]);

  return null;
}
