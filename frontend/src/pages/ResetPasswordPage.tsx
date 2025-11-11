import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { LockReset } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useResetPasswordMutation } from '@/redux/api/authApi';

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setErrorMessage('Token inválido o expirado');
      return;
    }

    try {
      setErrorMessage('');
      setSuccessMessage('');

      await resetPassword({
        token,
        newPassword: data.password,
      }).unwrap();

      setSuccessMessage('Contraseña restablecida exitosamente. Redirigiendo...');

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Error al restablecer contraseña:', error);
      setErrorMessage(
        error?.data?.message || 'Error al restablecer la contraseña. El token puede haber expirado.'
      );
    }
  };

  // Si no hay token, mostrar error
  if (!token) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={6}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 2,
            }}
          >
            <Alert severity="error" sx={{ mb: 2 }}>
              Token inválido o expirado. Por favor, solicita un nuevo enlace de
              recuperación.
            </Alert>
            <Button
              variant="contained"
              onClick={() => navigate('/forgot-password')}
            >
              Solicitar nuevo enlace
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
          }}
        >
          {/* Icono */}
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: 'primary.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <LockReset sx={{ fontSize: 32, color: 'primary.main' }} />
          </Box>

          {/* Título */}
          <Typography
            component="h1"
            variant="h5"
            fontWeight="bold"
            gutterBottom
          >
            Restablecer Contraseña
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            gutterBottom
            sx={{ mb: 3 }}
          >
            Ingresa tu nueva contraseña
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ width: '100%' }}
          >
            {/* Mensaje de éxito */}
            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}

            {/* Mensaje de error */}
            {errorMessage && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMessage}
              </Alert>
            )}

            {/* Nueva contraseña */}
            <TextField
              fullWidth
              label="Nueva Contraseña"
              type="password"
              autoFocus
              margin="normal"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            {/* Confirmar contraseña */}
            <TextField
              fullWidth
              label="Confirmar Contraseña"
              type="password"
              margin="normal"
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />

            {/* Botón de restablecer */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mt: 3, mb: 2 }}
            >
              {isLoading ? (
                <CircularProgress size={24} />
              ) : (
                'Restablecer Contraseña'
              )}
            </Button>
          </Box>
        </Paper>

        {/* Footer */}
        <Typography
          variant="body2"
          color="white"
          align="center"
          sx={{ mt: 3 }}
        >
          © 2025 Databrokers. Todos los derechos reservados.
        </Typography>
      </Container>
    </Box>
  );
};

export default ResetPasswordPage;
