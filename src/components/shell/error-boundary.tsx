"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-lg flex flex-1 items-center justify-center">
          <div className="max-w-md text-center">
            <AlertTriangle size={55} className="mb-md text-highlight-10 mx-auto" />
            <h2 className="mb-base text-subheading font-semibold">Something went wrong</h2>
            <p className="mb-md text-body text-highlight-10">
              An unexpected error occurred. Try reloading this section.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-md p-sm text-body rounded-md border text-left">
                <summary className="cursor-pointer font-medium">Error details</summary>
                <pre className="mt-base text-status-danger overflow-auto whitespace-pre-wrap">
                  {this.state.error.message}
                  {"\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="gap-base px-sm py-base text-body bg-primary text-primary-foreground hover:bg-primary/80 inline-flex items-center rounded-lg font-medium"
            >
              <RefreshCw size={13} />
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
