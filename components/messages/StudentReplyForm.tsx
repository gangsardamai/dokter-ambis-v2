"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  replyStudentMessageAction,
  type LessonMessageActionResult,
} from "@/app/actions/lesson-message.actions";
import {
  PendingFormControls,
  PendingSubmitButton,
} from "@/components/forms/PendingForm";

const initialState: LessonMessageActionResult = {
  success: false,
  message: "",
};

export default function StudentReplyForm({ threadId }: { threadId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    replyStudentMessageAction.bind(null, threadId),
    initialState,
  );

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mt-5">
      <PendingFormControls pendingMessage="Pesan sedang dikirim. Mohon tunggu.">
        <label
          htmlFor="message"
          className="mb-2 block text-sm font-black text-slate-700"
        >
          Balasan Anda
        </label>
        <textarea
          id="message"
          name="message"
          required
          maxLength={2000}
          rows={5}
          placeholder="Tulis balasan atau pertanyaan lanjutan..."
          className="w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {state.message ? (
            <p
              className={`text-sm font-bold ${
                state.success ? "text-emerald-700" : "text-red-700"
              }`}
            >
              {state.message}
            </p>
          ) : (
            <span />
          )}
          <PendingSubmitButton
            pendingLabel="Mengirim..."
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
          >
            Kirim Balasan
          </PendingSubmitButton>
        </div>
      </PendingFormControls>
    </form>
  );
}
