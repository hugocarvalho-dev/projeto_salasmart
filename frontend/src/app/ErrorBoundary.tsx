import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erro de renderização capturado pelo ErrorBoundary:", error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f0eeeb] p-6">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#f0eeeb] p-8 text-center">
            <h1 className="text-xl font-black text-[#1a1a1a]">Algo deu errado</h1>
            <p className="text-[#6b6b6b] text-sm font-medium mt-2">
              Ocorreu um erro inesperado na tela. Você pode recarregar a página para tentar
              novamente.
            </p>
            <button
              onClick={this.handleReload}
              className="mt-6 w-full bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-95 text-white font-bold text-sm py-3 rounded-xl transition-all"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
