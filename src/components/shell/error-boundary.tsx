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
        <div className="flex flex-1 items-center justify-center p-lg">
          <div className="max-w-md text-center">
            <AlertTriangle size={55} className="mx-auto mb-md text-amber-500" />
            <h2 className="mb-base text-subheading font-semibold">Something went wrong</h2>
            <p className="mb-md text-body text-gray-500">
              An unexpected error occurred. Try reloading this section.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-md rounded border p-sm text-left text-body">
                <summary className="cursor-pointer font-medium">Error details</summary>
                <pre className="mt-base overflow-auto whitespace-pre-wrap text-red-600">
                  {this.state.error.message}
                  {"\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-base rounded-lg bg-gray-900 px-sm py-base text-body font-medium text-white hover:bg-gray-800"
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
