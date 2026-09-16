<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Dokter Ambis UI Rules

## Mandatory loading feedback for buttons

Every button that starts an asynchronous action, form submission, upload, mutation, deletion, save, reset, connect, or other operation that may take noticeable time MUST show an immediate loading state after it is clicked.

Requirements:
- Show a visible spinner/loading indicator and a clear pending label such as `Memproses...`, `Menyimpan...`, `Menghapus...`, or `Mengunggah...`.
- Disable the initiating button while the action is pending to prevent duplicate submissions.
- Preserve accessibility with `aria-busy`/`aria-disabled` where applicable.
- For server-action form submit buttons, prefer the existing `PendingSubmitButton` from `components/forms/PendingForm.tsx` instead of a plain `<button type="submit">`.
- For client-side async buttons, track pending state locally and apply the same spinner + disabled behavior.
- Do not add a new interactive button without a loading state when it can trigger asynchronous work.
