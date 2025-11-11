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
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch } from '@/redux/hooks';
import { useLoginMutation } from '@/redux/api/authApi';
import { setCredentials } from '@/redux/slices/authSlice';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setErrorMessage('');
      const result = await login({
        email: data.email,
        password: data.password,
      }).unwrap();

      // Guardar credenciales en Redux
      dispatch(
        setCredentials({
          user: result.user,
          token: result.token,
        })
      );

      // Si "Recordarme" está activado, guardar en localStorage
      if (data.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      // Redirigir según el rol del usuario
      switch (result.user.rol) {
        case 'ADMIN':
        case 'GESTOR':
          navigate('/dashboard');
          break;
        case 'CORREDOR':
          navigate('/publicaciones');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      setErrorMessage(
        error?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.'
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
          {/* Logo y título */}
          <Typography
            component="h1"
            variant="h4"
            fontWeight="bold"
            color="primary"
            gutterBottom
          >
            Databrokers
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Sistema de Gestión Inmobiliaria
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ mt: 3, width: '100%' }}
          >
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

            {/* Password */}
            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              margin="normal"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            {/* Recordarme */}
            <FormControlLabel
              control={<Checkbox {...register('rememberMe')} color="primary" />}
              label="Recordarme"
              sx={{ mt: 1 }}
            />

            {/* Botón de login */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mt: 3, mb: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
            </Button>

            {/* Link a recuperar contraseña */}
            <Box sx={{ textAlign: 'center' }}>
              <Link
                href="/forgot-password"
                variant="body2"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/forgot-password');
                }}
                sx={{ cursor: 'pointer' }}
              >
                ¿Olvidaste tu contraseña?
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

export default LoginPage;
