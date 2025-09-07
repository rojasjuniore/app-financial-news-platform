import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Accessible Error Boundary component
 * Provides screen reader friendly error messages and recovery options
 */
class AccessibleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error for monitoring
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                <AlertCircle 
                  className="h-8 w-8 text-red-600 dark:text-red-400" 
                  aria-hidden="true"
                />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Algo salió mal
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Ha ocurrido un error inesperado. Puedes intentar recargar la página o volver al inicio.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-describedby="reload-description"
              >
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                Recargar página
              </button>
              <div id="reload-description" className="sr-only">
                Recarga la página para intentar resolver el error
              </div>

              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-describedby="home-description"
              >
                <Home className="w-4 h-4 mr-2" aria-hidden="true" />
                Ir al inicio
              </button>
              <div id="home-description" className="sr-only">
                Navega a la página de inicio de la aplicación
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                  Detalles del error (desarrollo)
                </summary>
                <div className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-xs font-mono text-red-600 dark:text-red-400 overflow-auto max-h-32">
                  <div className="mb-2 font-bold">Error:</div>
                  <div className="mb-4">{this.state.error.message}</div>
                  {this.state.errorInfo && (
                    <>
                      <div className="mb-2 font-bold">Stack trace:</div>
                      <div>{this.state.errorInfo.componentStack}</div>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AccessibleErrorBoundary;