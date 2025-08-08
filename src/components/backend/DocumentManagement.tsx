
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Upload,
  FileText,
  Link as LinkIcon,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  Plus,
  Calendar,
  Tag,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  title: string;
  description: string;
  type: "file" | "link";
  source?: string;
  author?: string;
  category: string;
  keywords: string[];
  status: "draft" | "processing" | "published" | "archived";
  uploadDate: Date;
  size?: string;
  aiAnalysis?: {
    summary: string;
    extractedKeywords: string[];
    scope: string;
    confidence: number;
    correlations: string[];
  };
}

export const DocumentManagement = () => {
  const [documents] = useState<Document[]>([
    {
      id: "1",
      title: "Regolamento PAC 2023-2027",
      description: "Nuovo regolamento della Politica Agricola Comune",
      type: "file",
      author: "Commissione Europea",
      category: "PAC",
      keywords: ["pac", "regolamento", "sussidi"],
      status: "published",
      uploadDate: new Date("2024-01-15"),
      size: "2.3 MB",
      aiAnalysis: {
        summary: "Il regolamento PAC 2023-2027 introduce nuove misure di sostegno agli agricoltori...",
        extractedKeywords: ["pagamenti diretti", "ecoschemi", "condizionalità"],
        scope: "Normativa europea",
        confidence: 0.92,
        correlations: ["PSR", "FEASR"]
      }
    },
    {
      id: "2",
      title: "Guida Certificazione BIO",
      description: "Linee guida per la certificazione biologica",
      type: "link",
      source: "https://sinab.it",
      category: "BIO",
      keywords: ["biologico", "certificazione"],
      status: "published",
      uploadDate: new Date("2024-01-10"),
      aiAnalysis: {
        summary: "Procedura completa per ottenere la certificazione biologica in Italia...",
        extractedKeywords: ["organico", "controlli", "etichettatura"],
        scope: "Certificazione",
        confidence: 0.88,
        correlations: ["DOP", "IGP"]
      }
    },
    {
      id: "3",
      title: "PNRR Agrisolare",
      description: "Bando per impianti fotovoltaici in agricoltura",
      type: "file",
      category: "PNRR",
      keywords: ["fotovoltaico", "energia", "bando"],
      status: "processing",
      uploadDate: new Date("2024-01-20"),
      size: "1.8 MB"
    }
  ]);

  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    status: "all",
    type: "all"
  });

  const [newDocument, setNewDocument] = useState({
    title: "",
    description: "",
    type: "file" as "file" | "link",
    source: "",
    author: "",
    category: "PAC",
    keywords: ""
  });

  const { toast } = useToast();

  const categories = ["PAC", "PSR", "BIO", "IoT", "FEASR", "PNRR", "Sostenibilità", "Normativa"];

  const filteredDocuments = documents.filter(doc => {
    return (
      (!filters.search || 
        doc.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        doc.description.toLowerCase().includes(filters.search.toLowerCase())) &&
      (filters.category === "all" || doc.category === filters.category) &&
      (filters.status === "all" || doc.status === filters.status) &&
      (filters.type === "all" || doc.type === filters.type)
    );
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      processing: "bg-yellow-100 text-yellow-800",
      published: "bg-green-100 text-green-800",
      archived: "bg-red-100 text-red-800"
    };

    const icons = {
      draft: <Edit className="h-3 w-3 mr-1" />,
      processing: <Clock className="h-3 w-3 mr-1" />,
      published: <CheckCircle className="h-3 w-3 mr-1" />,
      archived: <AlertCircle className="h-3 w-3 mr-1" />
    };

    const labels = {
      draft: "Bozza",
      processing: "In Elaborazione",
      published: "Pubblicato",
      archived: "Archiviato"
    };

    return (
      <Badge className={`flex items-center ${colors[status as keyof typeof colors]}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const handleUpload = () => {
    if (!newDocument.title || !newDocument.description) {
      toast({
        title: "Errore",
        description: "Titolo e descrizione sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Documento caricato",
      description: "Il documento è stato caricato e verrà analizzato dall'AI",
    });

    // Reset form
    setNewDocument({
      title: "",
      description: "",
      type: "file",
      source: "",
      author: "",
      category: "PAC",
      keywords: ""
    });
  };

  const triggerAIAnalysis = (docId: string) => {
    toast({
      title: "Analisi AI avviata",
      description: "Il documento verrà rianalizzato dall'AI",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-green-800">Gestione Documenti</h2>
          <p className="text-green-600">Carica e gestisci la base documentale del chatbot</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Documento
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-green-600">Totale Documenti</p>
              <p className="text-2xl font-bold text-green-800">{documents.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-green-600">Pubblicati</p>
              <p className="text-2xl font-bold text-green-800">
                {documents.filter(d => d.status === "published").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm text-green-600">In Elaborazione</p>
              <p className="text-2xl font-bold text-green-800">
                {documents.filter(d => d.status === "processing").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Tag className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-green-600">Categorie</p>
              <p className="text-2xl font-bold text-green-800">{categories.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Upload Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-green-800 mb-4">Carica Nuovo Documento</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titolo *</Label>
              <Input
                id="title"
                value={newDocument.title}
                onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                placeholder="Titolo del documento"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrizione *</Label>
              <Textarea
                id="description"
                value={newDocument.description}
                onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                placeholder="Descrizione del contenuto"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="author">Autore/Fonte</Label>
              <Input
                id="author"
                value={newDocument.author}
                onChange={(e) => setNewDocument({...newDocument, author: e.target.value})}
                placeholder="Es. Commissione Europea"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="type">Tipo</Label>
              <select 
                id="type"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={newDocument.type}
                onChange={(e) => setNewDocument({...newDocument, type: e.target.value as "file" | "link"})}
              >
                <option value="file">File Upload</option>
                <option value="link">Link Esterno</option>
              </select>
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <select 
                id="category"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={newDocument.category}
                onChange={(e) => setNewDocument({...newDocument, category: e.target.value})}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {newDocument.type === "file" ? (
              <div>
                <Label htmlFor="file">File</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Clicca per caricare o trascina qui</p>
                  <p className="text-xs text-gray-500">PDF, DOCX, TXT (max 10MB)</p>
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="source">URL</Label>
                <Input
                  id="source"
                  value={newDocument.source}
                  onChange={(e) => setNewDocument({...newDocument, source: e.target.value})}
                  placeholder="https://esempio.com/documento"
                />
              </div>
            )}

            <div>
              <Label htmlFor="keywords">Keywords (separate con virgole)</Label>
              <Input
                id="keywords"
                value={newDocument.keywords}
                onChange={(e) => setNewDocument({...newDocument, keywords: e.target.value})}
                placeholder="pac, sussidi, agricoltura"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleUpload} className="bg-green-600 hover:bg-green-700">
            <Upload className="h-4 w-4 mr-2" />
            Carica e Analizza
          </Button>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-green-600" />
            <Input
              placeholder="Cerca documenti..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="pl-10"
            />
          </div>
          
          <select 
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
          >
            <option value="all">Tutte le categorie</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select 
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="all">Tutti gli stati</option>
            <option value="draft">Bozza</option>
            <option value="processing">In Elaborazione</option>
            <option value="published">Pubblicato</option>
            <option value="archived">Archiviato</option>
          </select>

          <select 
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
          >
            <option value="all">Tutti i tipi</option>
            <option value="file">File</option>
            <option value="link">Link</option>
          </select>
        </div>
      </Card>

      {/* Documents Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Documento</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Analisi AI</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <div className="flex items-start space-x-3">
                    {doc.type === "file" ? (
                      <FileText className="h-5 w-5 text-green-600 mt-1" />
                    ) : (
                      <LinkIcon className="h-5 w-5 text-blue-600 mt-1" />
                    )}
                    <div>
                      <p className="font-medium text-green-800">{doc.title}</p>
                      <p className="text-sm text-green-600">{doc.description}</p>
                      {doc.author && (
                        <p className="text-xs text-green-500">di {doc.author}</p>
                      )}
                      {doc.size && (
                        <p className="text-xs text-green-500">{doc.size}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge variant="outline">{doc.category}</Badge>
                </TableCell>
                
                <TableCell>
                  {getStatusBadge(doc.status)}
                </TableCell>
                
                <TableCell>
                  {doc.aiAnalysis ? (
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-600 rounded-full" 
                            style={{ width: `${doc.aiAnalysis.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-green-600">
                          {Math.round(doc.aiAnalysis.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-green-500">
                        {doc.aiAnalysis.extractedKeywords.slice(0, 3).join(", ")}
                      </p>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => triggerAIAnalysis(doc.id)}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Analizza
                    </Button>
                  )}
                </TableCell>
                
                <TableCell>
                  <span className="text-sm text-green-600">
                    {doc.uploadDate.toLocaleDateString()}
                  </span>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button size="sm" variant="outline" title="Visualizza">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" title="Modifica">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" title="Download">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      title="Elimina"
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
