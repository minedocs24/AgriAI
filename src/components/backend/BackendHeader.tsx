
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export const BackendHeader = () => {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 p-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-green-800">Backend AgriAI</h1>
              <p className="text-sm text-green-600">Pannello di Controllo Gestore</p>
            </div>
          </div>
          
          <Button 
            onClick={() => window.location.href = "/"}
            variant="outline"
            className="border-green-200 text-green-700 hover:bg-green-50"
          >
            Torna alla Chat
          </Button>
        </div>
      </div>
    </header>
  );
};
