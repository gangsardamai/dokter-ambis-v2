export function formatDuration(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  if (hour === 0) {
    return `${minute} menit`;
  }

  if (minute === 0) {
    return `${hour} jam`;
  }

  return `${hour} jam ${minute} menit`;
}