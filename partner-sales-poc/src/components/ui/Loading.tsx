export function Loading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="w-7 h-7 border-[3px] border-border border-t-accent rounded-full animate-spin mb-3" />
      <p className="text-xs text-secondary">{message}</p>
    </div>
  );
}
