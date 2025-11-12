import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper, Alert, Stack } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon, Home as HomeIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Store error info in state
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you could send error to logging service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });
    } else {
      // Max retries reached, just reset without incrementing
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { fallback, maxRetries = 3 } = this.props;
      const { error, retryCount } = this.state;

      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      const canRetry = retryCount < maxRetries;

      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            p: 3,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 700,
              width: '100%',
            }}
          >
            <Stack spacing={3} alignItems="center">
              <ErrorIcon sx={{ fontSize: 80, color: 'error.main' }} />

              <Typography variant="h4" component="h1" textAlign="center">
                Algo salió mal
              </Typography>

              <Typography variant="body1" color="text.secondary" textAlign="center">
                {error?.message || 'Ha ocurrido un error inesperado en la aplicación'}
              </Typography>

              {retryCount > 0 && (
                <Alert severity="warning" sx={{ width: '100%' }}>
                  Intento {retryCount} de {maxRetries}
                </Alert>
              )}

              {!canRetry && (
                <Alert severity="error" sx={{ width: '100%' }}>
                  Se alcanzó el número máximo de reintentos. Por favor, recarga la página o vuelve al inicio.
                </Alert>
              )}

              {/* Development mode: Show error stack */}
              {import.meta.env.DEV && error?.stack && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    width: '100%',
                    maxHeight: 200,
                    overflow: 'auto',
                    backgroundColor: 'grey.50'
                  }}
                >
                  <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                    {error.stack}
                  </Typography>
                </Paper>
              )}

              <Stack direction="row" spacing={2}>
                {canRetry && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<RefreshIcon />}
                    onClick={this.handleReset}
                  >
                    Intentar de nuevo
                  </Button>
                )}
                <Button
                  variant={canRetry ? 'outlined' : 'contained'}
                  startIcon={<HomeIcon />}
                  onClick={this.handleGoHome}
                >
                  Volver al inicio
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
