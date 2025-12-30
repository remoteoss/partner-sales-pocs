import config from '../../config/partner';

export function Loading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div
        className="w-8 h-8 border-4 rounded-full animate-spin mb-4"
        style={{
          borderColor: config.colors.borders,
          borderTopColor: config.colors.primary,
        }}
      />
      <p style={{ color: config.colors.secondary }}>{message}</p>
    </div>
  );
}

