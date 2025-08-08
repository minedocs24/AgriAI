import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sprout, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: 'PUBLIC' | 'MEMBER' | 'ADMIN';
  organizationId?: string;
  acceptTerms: boolean;
  acceptNewsletter: boolean;
}

interface RegisterError {
  message: string;
  field?: string;
}

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [form, setForm] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: 'PUBLIC',
    acceptTerms: false,
    acceptNewsletter: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<RegisterError | null>(null);

  const handleInputChange = (field: keyof RegisterForm) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm(prev => ({
      ...prev,
      [field]: field === 'acceptTerms' || field === 'acceptNewsletter' 
        ? e.target.checked 
        : e.target.value
    }));
    
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSelectChange = (field: keyof RegisterForm) => (value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!form.firstName.trim()) {
      setError({ message: "Il nome è obbligatorio", field: "firstName" });
      return false;
    }
    
    if (!form.lastName.trim()) {
      setError({ message: "Il cognome è obbligatorio", field: "lastName" });
      return false;
    }
    
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
    
    if (form.password.length < 8) {
      setError({ message: "La password deve essere di almeno 8 caratteri", field: "password" });
      return false;
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      setError({ 
        message: "La password deve contenere almeno una lettera maiuscola, una minuscola e un numero", 
        field: "password" 
      });
      return false;
    }
    
    if (form.password !== form.confirmPassword) {
      setError({ message: "Le password non corrispondono", field: "confirmPassword" });
      return false;
    }
    
    if (!form.acceptTerms) {
      setError({ message: "Devi accettare i Termini di Servizio", field: "acceptTerms" });
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
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.toLowerCase(),
        password: form.password,
        userType: form.userType,
        organizationId: form.organizationId
      });
      
      // Redirect to chat page after successful registration
      navigate('/chat');
      
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Handle different error types
      if (err.message.includes('Email already exists')) {
        setError({ message: "Questa email è già registrata. Prova ad accedere invece.", field: "email" });
      } else if (err.message.includes('validation_error')) {
        setError({ message: "Dati non validi. Controlla tutti i campi." });
      } else if (err.message.includes('weak_password')) {
        setError({ message: "Password troppo debole. Usa almeno 8 caratteri con maiuscole, minuscole e numeri.", field: "password" });
      } else {
        setError({ message: "Errore durante la registrazione. Riprova più tardi." });
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string): { strength: number; text: string; color: string } => {
    if (!password) return { strength: 0, text: "", color: "" };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    
    if (strength <= 2) return { strength, text: "Debole", color: "text-red-600" };
    if (strength <= 3) return { strength, text: "Media", color: "text-yellow-600" };
    if (strength <= 4) return { strength, text: "Forte", color: "text-green-600" };
    return { strength, text: "Molto Forte", color: "text-green-700" };
  };

  const passwordStrength = getPasswordStrength(form.password);

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

      {/* Registration Card */}
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-green-100 shadow-xl mt-20 mb-8">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-green-800">
            Registrati ad AgriAI
          </CardTitle>
          <CardDescription className="text-green-600">
            Crea il tuo account per accedere a tutte le funzionalità
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
            
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-green-800">Nome</Label>
                <Input
                  id="firstName"
                  placeholder="Mario"
                  value={form.firstName}
                  onChange={handleInputChange('firstName')}
                  className={`border-green-200 focus:border-green-500 ${
                    error?.field === 'firstName' ? 'border-red-300 focus:border-red-500' : ''
                  }`}
                  disabled={loading}
                  autoComplete="given-name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-green-800">Cognome</Label>
                <Input
                  id="lastName"
                  placeholder="Rossi"
                  value={form.lastName}
                  onChange={handleInputChange('lastName')}
                  className={`border-green-200 focus:border-green-500 ${
                    error?.field === 'lastName' ? 'border-red-300 focus:border-red-500' : ''
                  }`}
                  disabled={loading}
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>
            
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-green-800">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="mario.rossi@azienda.it"
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
            
            {/* User Type */}
            <div className="space-y-2">
              <Label className="text-green-800">Tipo di Account</Label>
              <Select value={form.userType} onValueChange={handleSelectChange('userType')}>
                <SelectTrigger className="border-green-200 focus:border-green-500">
                  <SelectValue placeholder="Seleziona il tipo di account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Pubblico - Accesso di base</SelectItem>
                  <SelectItem value="MEMBER">Membro - Accesso avanzato</SelectItem>
                  <SelectItem value="ADMIN">Admin - Accesso completo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-green-800">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Almeno 8 caratteri"
                  value={form.password}
                  onChange={handleInputChange('password')}
                  className={`border-green-200 focus:border-green-500 pr-10 ${
                    error?.field === 'password' ? 'border-red-300 focus:border-red-500' : ''
                  }`}
                  disabled={loading}
                  autoComplete="new-password"
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
              
              {/* Password Strength Indicator */}
              {form.password && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={passwordStrength.color}>
                      Sicurezza: {passwordStrength.text}
                    </span>
                    <span className="text-green-600">
                      {passwordStrength.strength}/5
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full transition-all duration-300 ${
                        passwordStrength.strength <= 2 ? 'bg-red-500' :
                        passwordStrength.strength <= 3 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-green-800">Conferma Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ripeti la password"
                  value={form.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  className={`border-green-200 focus:border-green-500 pr-10 ${
                    error?.field === 'confirmPassword' ? 'border-red-300 focus:border-red-500' : ''
                  }`}
                  disabled={loading}
                  autoComplete="new-password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-green-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-green-600" />
                  )}
                </Button>
              </div>
              
              {/* Password Match Indicator */}
              {form.confirmPassword && (
                <div className="flex items-center space-x-1 text-xs">
                  {form.password === form.confirmPassword ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">Le password corrispondono</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 text-red-600" />
                      <span className="text-red-600">Le password non corrispondono</span>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Terms and Newsletter */}
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="acceptTerms"
                  checked={form.acceptTerms}
                  onCheckedChange={(checked) => 
                    setForm(prev => ({ ...prev, acceptTerms: !!checked }))
                  }
                  className={`border-green-300 data-[state=checked]:bg-green-600 mt-1 ${
                    error?.field === 'acceptTerms' ? 'border-red-300' : ''
                  }`}
                  disabled={loading}
                />
                <Label 
                  htmlFor="acceptTerms" 
                  className="text-xs text-green-700 cursor-pointer leading-4"
                >
                  Accetto i{' '}
                  <Link to="/terms" className="underline hover:text-green-800">
                    Termini di Servizio
                  </Link>{' '}
                  e l'{' '}
                  <Link to="/privacy" className="underline hover:text-green-800">
                    Informativa Privacy
                  </Link>
                </Label>
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="acceptNewsletter"
                  checked={form.acceptNewsletter}
                  onCheckedChange={(checked) => 
                    setForm(prev => ({ ...prev, acceptNewsletter: !!checked }))
                  }
                  className="border-green-300 data-[state=checked]:bg-green-600 mt-1"
                  disabled={loading}
                />
                <Label 
                  htmlFor="acceptNewsletter" 
                  className="text-xs text-green-600 cursor-pointer leading-4"
                >
                  Voglio ricevere aggiornamenti e newsletter da AgriAI
                </Label>
              </div>
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
                  Registrazione in corso...
                </>
              ) : (
                'Crea Account'
              )}
            </Button>
          </form>
          
          {/* Footer Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-green-600">
              Hai già un account?{' '}
              <Link 
                to="/login" 
                className="text-green-700 hover:text-green-800 font-medium underline"
              >
                Accedi qui
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;