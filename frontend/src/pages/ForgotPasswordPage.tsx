import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, Email } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForgotPasswordMutation } from '@/redux/api/authApi';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');

      await forgotPassword(data).unwrap();

      setSuccessMessage(
        'Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña.'
      );
    } catch (error: any) {
      console.error('Error en recuperar contraseña:', error);
      setErrorMessage(
        error?.data?.message || 'Error al procesar tu solicitud. Intenta nuevamente.'
      );
    }
  };

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
            <Email sx={{ fontSize: 32, color: 'primary.main' }} />
          </Box>

          {/* Título */}
          <Typography
            component="h1"
            variant="h5"
            fontWeight="bold"
            gutterBottom
          >
            ¿Olvidaste tu contraseña?
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            gutterBottom
            sx={{ mb: 3 }}
          >
            Ingresa tu correo electrónico y te enviaremos instrucciones para
            restablecer tu contraseña.
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

            {/* Email */}
            <TextField
              fullWidth
              label="Email"
              type="email"
              autoComplete="email"
              autoFocus
              margin="normal"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            {/* Botón de enviar */}
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
                'Enviar instrucciones'
              )}
            </Button>

            {/* Link a login */}
            <Box sx={{ textAlign: 'center' }}>
              <Link
                href="/login"
                variant="body2"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                }}
              >
                <ArrowBack fontSize="small" />
                Volver al inicio de sesión
              </Link>
            </Box>
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

export default ForgotPasswordPage;
