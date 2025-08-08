import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sprout, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginError {
  message: string;
  field?: string;
}

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
    rememberMe: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);

  const handleInputChange = (field: keyof LoginForm) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm(prev => ({
      ...prev,
      [field]: field === 'rememberMe' ? e.target.checked : e.target.value
    }));
    
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!form.email) {
      setError({ message: "L'email è obbligatoria", field: "email" });
      return false;
    }
    
    if (!form.email.includes("@")) {
      setError({ message: "Inserisci un'email valida", field: "email" });
      return false;
    }
    
    if (!form.password) {
      setError({ message: "La password è obbligatoria", field: "password" });
      return false;
    }
    
    if (form.password.length < 6) {
      setError({ message: "La password deve essere di almeno 6 caratteri", field: "password" });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await login({
        email: form.email,
        password: form.password,
        rememberMe: form.rememberMe,
        deviceInfo: {
          deviceType: 'web',
          deviceName: navigator.userAgent,
          browserName: navigator.userAgent.split(' ').pop() || 'Unknown',
          osName: navigator.platform
        }
      });
      
      // Redirect to chat page after successful login
      navigate('/chat');
      
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle different error types
      if (err.message.includes('Invalid credentials')) {
        setError({ message: "Email o password non corretti" });
      } else if (err.message.includes('Account temporarily locked')) {
        setError({ message: "Account temporaneamente bloccato per troppi tentativi falliti" });
      } else if (err.message.includes('validation_error')) {
        setError({ message: "Dati non validi. Controlla email e password." });
      } else if (err.message.includes('rate_limit')) {
        setError({ message: "Troppi tentativi di login. Riprova tra qualche minuto." });
      } else {
        setError({ message: "Errore di connessione. Riprova più tardi." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6">
        <Link to="/" className="flex items-center space-x-3 w-fit">
          <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl">
            <Sprout className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-green-800">AgriAI</h1>
            <p className="text-xs text-green-600">Il tuo assistente agricolo intelligente</p>
          </div>
        </Link>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-green-100 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-green-800">
            Accedi ad AgriAI
          </CardTitle>
          <CardDescription className="text-green-600">
            Inserisci le tue credenziali per continuare
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}
            
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-green-800">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="il-tuo-email@azienda.it"
                value={form.email}
                onChange={handleInputChange('email')}
                className={`border-green-200 focus:border-green-500 ${
                  error?.field === 'email' ? 'border-red-300 focus:border-red-500' : ''
                }`}
                disabled={loading}
                autoComplete="email"
                required
              />
            </div>
            
            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-green-800">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="La tua password"
                  value={form.password}
                  onChange={handleInputChange('password')}
                  className={`border-green-200 focus:border-green-500 pr-10 ${
                    error?.field === 'password' ? 'border-red-300 focus:border-red-500' : ''
                  }`}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-green-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-green-600" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Remember Me */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={form.rememberMe}
                onCheckedChange={(checked) => 
                  setForm(prev => ({ ...prev, rememberMe: !!checked }))
                }
                className="border-green-300 data-[state=checked]:bg-green-600"
                disabled={loading}
              />
              <Label 
                htmlFor="rememberMe" 
                className="text-sm text-green-700 cursor-pointer"
              >
                Ricordami per 7 giorni
              </Label>
            </div>
            
            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accesso in corso...
                </>
              ) : (
                'Accedi'
              )}
            </Button>
          </form>
          
          {/* Footer Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-green-600">
              Non hai ancora un account?{' '}
              <Link 
                to="/register" 
                className="text-green-700 hover:text-green-800 font-medium underline"
              >
                Registrati qui
              </Link>
            </p>
            
            <p className="text-sm text-green-600">
              <Link 
                to="/forgot-password" 
                className="text-green-700 hover:text-green-800 font-medium underline"
              >
                Password dimenticata?
              </Link>
            </p>
            
            <div className="pt-4 border-t border-green-100">
              <p className="text-xs text-green-500">
                Accedendo accetti i nostri{' '}
                <Link to="/terms" className="underline hover:text-green-600">
                  Termini di Servizio
                </Link>{' '}
                e l'{' '}
                <Link to="/privacy" className="underline hover:text-green-600">
                  Informativa Privacy
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;