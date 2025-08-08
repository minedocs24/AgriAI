
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Settings,
  Tags,
  Database,
  Brain,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Plus,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const SystemConfig = () => {
  const [categories, setCategories] = useState([
    "PAC", "PSR", "BIO", "IoT", "FEASR", "PNRR", 
    "Sostenibilità", "Normativa", "Agronomia", "Digitalizzazione", "Finanza Agevolata"
  ]);
  
  const [standardKeywords, setStandardKeywords] = useState([
    "agricoltura", "sostenibilità", "normativa", "finanziamenti", "certificazione",
    "biologico", "digitale", "innovazione", "ambiente", "qualità"
  ]);

  const [newCategory, setNewCategory] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  
  const [aiConfig, setAiConfig] = useState({
    embeddingModel: "mixedbread-ai/mxbai-embed-xsmall-v1",
    confidenceThreshold: 0.7,
    maxSources: 3,
    autoRefresh: true,
    analysisDepth: "standard"
  });

  const [systemSettings, setSystemSettings] = useState({
    publicAccess: true,
    memberOnlyContent: true,
    autoModeration: true,
    logConversations: true,
    backupFrequency: "daily"
  });

  const { toast } = useToast();

  const addCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory("");
      toast({
        title: "Categoria aggiunta",
        description: `"${newCategory}" è stata aggiunta alle categorie`,
      });
    }
  };

  const removeCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category));
    toast({
      title: "Categoria rimossa",
      description: `"${category}" è stata rimossa`,
    });
  };

  const addKeyword = () => {
    if (newKeyword && !standardKeywords.includes(newKeyword.toLowerCase())) {
      setStandardKeywords([...standardKeywords, newKeyword.toLowerCase()]);
      setNewKeyword("");
      toast({
        title: "Keyword aggiunta",
        description: `"${newKeyword}" è stata aggiunta alle keywords standard`,
      });
    }
  };

  const removeKeyword = (keyword: string) => {
    setStandardKeywords(standardKeywords.filter(k => k !== keyword));
    toast({
      title: "Keyword rimossa",
      description: `"${keyword}" è stata rimossa`,
    });
  };

  const refreshEmbeddings = () => {
    toast({
      title: "Aggiornamento avviato",
      description: "Aggiornamento embeddings in corso...",
    });
    // Simulate refresh process
    setTimeout(() => {
      toast({
        title: "Aggiornamento completato",
        description: "Embeddings aggiornati con successo",
      });
    }, 3000);
  };

  const exportData = () => {
    toast({
      title: "Export avviato",
      description: "Preparazione backup in corso...",
    });
  };

  const saveSettings = () => {
    toast({
      title: "Impostazioni salvate",
      description: "Tutte le configurazioni sono state aggiornate",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-green-800">Configurazioni Avanzate</h2>
        <p className="text-green-600">Personalizza categorie, keywords e impostazioni AI</p>
      </div>

      {/* Categories Management */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Tags className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-green-800">Categorie Tematiche</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <Badge key={index} variant="outline" className="flex items-center space-x-2">
                <span>{category}</span>
                <button
                  onClick={() => removeCategory(category)}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <Input
              placeholder="Nuova categoria..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              className="flex-1"
            />
            <Button onClick={addCategory} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Keywords Management */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Tags className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-green-800">Keywords Standard</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {standardKeywords.map((keyword, index) => (
              <Badge key={index} variant="secondary" className="flex items-center space-x-2">
                <span>{keyword}</span>
                <button
                  onClick={() => removeKeyword(keyword)}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <Input
              placeholder="Nuova keyword..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              className="flex-1"
            />
            <Button onClick={addKeyword} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* AI Configuration */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-green-800">Configurazioni AI</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="embeddingModel">Modello Embedding</Label>
              <select 
                id="embeddingModel"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1"
                value={aiConfig.embeddingModel}
                onChange={(e) => setAiConfig({...aiConfig, embeddingModel: e.target.value})}
              >
                <option value="mixedbread-ai/mxbai-embed-xsmall-v1">MixedBread AI (Piccolo)</option>
                <option value="sentence-transformers/all-MiniLM-L6-v2">SentenceTransformers (Veloce)</option>
                <option value="text-embedding-ada-002">OpenAI Ada (Preciso)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="confidenceThreshold">Soglia Confidenza</Label>
              <Input
                id="confidenceThreshold"
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={aiConfig.confidenceThreshold}
                onChange={(e) => setAiConfig({...aiConfig, confidenceThreshold: parseFloat(e.target.value)})}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="maxSources">Numero Max Fonti</Label>
              <Input
                id="maxSources"
                type="number"
                min="1"
                max="10"
                value={aiConfig.maxSources}
                onChange={(e) => setAiConfig({...aiConfig, maxSources: parseInt(e.target.value)})}
                className="mt-1"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoRefresh">Auto-refresh Embeddings</Label>
              <Switch
                id="autoRefresh"
                checked={aiConfig.autoRefresh}
                onCheckedChange={(checked) => setAiConfig({...aiConfig, autoRefresh: checked})}
              />
            </div>

            <div>
              <Label htmlFor="analysisDepth">Profondità Analisi</Label>
              <select 
                id="analysisDepth"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1"
                value={aiConfig.analysisDepth}
                onChange={(e) => setAiConfig({...aiConfig, analysisDepth: e.target.value})}
              >
                <option value="basic">Base</option>
                <option value="standard">Standard</option>
                <option value="deep">Approfondita</option>
              </select>
            </div>

            <Button onClick={refreshEmbeddings} className="w-full bg-green-600 hover:bg-green-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Aggiorna Embeddings
            </Button>
          </div>
        </div>
      </Card>

      {/* System Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-green-800">Impostazioni Sistema</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="publicAccess">Accesso Pubblico</Label>
              <Switch
                id="publicAccess"
                checked={systemSettings.publicAccess}
                onCheckedChange={(checked) => setSystemSettings({...systemSettings, publicAccess: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="memberOnlyContent">Contenuti Riservati Soci</Label>
              <Switch
                id="memberOnlyContent"
                checked={systemSettings.memberOnlyContent}
                onCheckedChange={(checked) => setSystemSettings({...systemSettings, memberOnlyContent: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoModeration">Moderazione Automatica</Label>
              <Switch
                id="autoModeration"
                checked={systemSettings.autoModeration}
                onCheckedChange={(checked) => setSystemSettings({...systemSettings, autoModeration: checked})}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="logConversations">Log Conversazioni</Label>
              <Switch
                id="logConversations"
                checked={systemSettings.logConversations}
                onCheckedChange={(checked) => setSystemSettings({...systemSettings, logConversations: checked})}
              />
            </div>

            <div>
              <Label htmlFor="backupFrequency">Frequenza Backup</Label>
              <select 
                id="backupFrequency"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1"
                value={systemSettings.backupFrequency}
                onChange={(e) => setSystemSettings({...systemSettings, backupFrequency: e.target.value})}
              >
                <option value="daily">Giornaliero</option>
                <option value="weekly">Settimanale</option>
                <option value="monthly">Mensile</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Data Management */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Database className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-green-800">Gestione Dati</h3>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Esporta Base Conoscenza
          </Button>
          
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importa Configurazioni
          </Button>
          
          <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-2" />
            Pulizia Cache
          </Button>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} className="bg-green-600 hover:bg-green-700">
          <Save className="h-4 w-4 mr-2" />
          Salva Tutte le Impostazioni
        </Button>
      </div>
    </div>
  );
};
