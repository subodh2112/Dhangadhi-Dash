import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { logCrash } from "@/lib/systemLogger";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const userId = localStorage.getItem("userId") || null;
    logCrash(error, errorInfo, userId);
  }

  handleRecovery = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="font-display font-bold text-xl text-foreground mb-2">Something went wrong</h1>
            <p className="text-sm text-foreground/50 mb-4">We've been notified of this error and are working on a fix.</p>
            {this.state.error?.message && (
              <p className="text-xs text-foreground/30 font-mono bg-muted rounded-lg p-2 mb-4 break-all">{this.state.error.message}</p>
            )}
            <div className="flex gap-2 justify-center">
              <button onClick={() => window.location.reload()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted text-foreground text-sm font-bold hover:bg-muted/80">
                <RefreshCw className="w-4 h-4" /> Reload
              </button>
              <button onClick={this.handleRecovery} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-saffron text-white text-sm font-bold">
                <Home className="w-4 h-4" /> Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}