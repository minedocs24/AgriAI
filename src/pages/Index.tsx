
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/ChatInterface";
import { useAuth } from "@/hooks/useAuth";
import { Sprout, Brain, Shield, Leaf, Zap, TrendingUp, User, LogOut } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [showChat, setShowChat] = useState(false);
  
  // Check if we're on the protected chat route
  const isProtectedRoute = location.pathname === '/chat';
  
  // If on protected route, user must be authenticated (handled by ProtectedRoute)
  // If on public route, show public landing page
  const shouldShowChat = isProtectedRoute || showChat;

  const features = [
    {
      icon: Shield,
      title: "Supporto Normativo",
      description: "PAC, PSR, FEASR e regolamenti",
      color: "from-green-600 to-green-700"
    },
    {
      icon: Leaf,
      title: "Sostenibilità",
      description: "Certificazioni BIO, DOP/IGP",
      color: "from-emerald-600 to-emerald-700"
    },
    {
      icon: Zap,
      title: "Innovazione",
      description: "IoT, AI, Smart Farming",
      color: "from-teal-600 to-teal-700"
    },
    {
      icon: TrendingUp,
      title: "Finanza Agevolata",
      description: "PNRR, bandi europei",
      color: "from-green-700 to-green-800"
    },
    {
      icon: Brain,
      title: "Gestione Agronomica",
      description: "Meteo, fertilizzazione, modelli predittivi",
      color: "from-lime-600 to-lime-700"
    }
  ];

  const handleChatStart = () => {
    if (isAuthenticated) {
      // If user is authenticated, navigate to protected chat
      navigate('/chat');
    } else {
      // If not authenticated, redirect to login
      navigate('/login');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl">
              <Sprout className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-green-800">AgriAI</h1>
              <p className="text-sm text-green-600">Il tuo assistente agricolo intelligente</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center space-x-2 text-green-700">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  className="border-green-200 text-green-700 hover:bg-green-50"
                  disabled={isLoading}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  Accedi
                </Button>
                <Button 
                  onClick={handleChatStart}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Inizia a chattare
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {shouldShowChat ? (
        <ChatInterface onBack={() => {
          if (isProtectedRoute) {
            navigate('/');
          } else {
            setShowChat(false);
          }
        }} />
      ) : (
        <main className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-6">
              <Brain className="h-4 w-4" />
              <span className="text-sm font-medium">Powered by AI</span>
            </div>
            
            <h2 className="text-5xl font-bold text-green-800 mb-6">
              L'agricoltura del futuro è qui
            </h2>
            <p className="text-xl text-green-600 mb-8 max-w-2xl mx-auto">
              AgriAI è il chatbot intelligente che rivoluziona il mondo agricolo con risposte precise, 
              ironiche quando serve, ma sempre professionali. 🌾
            </p>
            
            <Button 
              onClick={handleChatStart}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 text-lg"
            >
              {isAuthenticated ? 'Continua a chattare con AgriAI' : 'Inizia a chattare con AgriAI'}
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 bg-white/60 backdrop-blur-sm border-green-100 hover:shadow-lg transition-all duration-300">
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${feature.color} mb-4`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-green-800 mb-2">{feature.title}</h3>
                <p className="text-green-600">{feature.description}</p>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-center text-white">
            <h3 className="text-3xl font-bold mb-4">Pronto a trasformare la tua azienda agricola?</h3>
            <p className="text-xl opacity-90 mb-6">
              Unisciti a migliaia di agricoltori che già usano AgriAI per ottimizzare le loro attività
            </p>
            <Button 
              onClick={handleChatStart}
              size="lg" 
              variant="secondary"
              className="bg-white text-green-600 hover:bg-green-50"
            >
              {isAuthenticated ? 'Vai alla Chat' : 'Prova AgriAI Gratuitamente'}
            </Button>
          </div>
        </main>
      )}
    </div>
  );
};

export default Index;
