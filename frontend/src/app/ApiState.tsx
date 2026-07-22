import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import { ApiError } from "../api/portal";

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Ocorreu um erro inesperado.";
}

const isOffline = (e: unknown) => e instanceof ApiError && e.offline;

export function ApiErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const offline = isOffline(error);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#f0eeeb] p-10 flex flex-col items-center text-center">
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
          offline ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-700"
        }`}
      >
        {offline ? <WifiOff className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
      </div>
      <h3 className="text-lg font-black text-[#1a1a1a] mb-1">
        {offline ? "Sistema indisponível" : "Não foi possível carregar"}
      </h3>
      <p className="text-[#6b6b6b] text-sm font-medium max-w-sm mb-5">{errorMessage(error)}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all active:scale-95"
        >
          <RefreshCw className="w-4 h-4" /> Tentar novamente
        </button>
      )}
    </div>
  );
}

export function ApiErrorBanner({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2">
      {isOffline(error) ? (
        <WifiOff className="w-4 h-4 flex-shrink-0" />
      ) : (
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      )}
      <span className="flex-1">{errorMessage(error)}</span>
      {onRetry && (
        <button onClick={onRetry} className="underline underline-offset-2 hover:no-underline">
          Tentar novamente
        </button>
      )}
    </div>
  );
}
