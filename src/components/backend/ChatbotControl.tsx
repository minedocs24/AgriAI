
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  MessageSquare,
  Search,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  User,
  Bot
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  userId: string;
  userType: "public" | "member";
  question: string;
  answer: string;
  sources: {
    documentId: string;
    documentTitle: string;
    relevantSection: string;
    confidence: number;
  }[];
  confidence: number;
  feedback?: "positive" | "negative";
  timestamp: Date;
  status: "answered" | "flagged" | "reviewed";
}

export const ChatbotControl = () => {
  const [conversations] = useState<Conversation[]>([
    {
      id: "1",
      userId: "user123",
      userType: "member",
      question: "Quali sono i requisiti per accedere ai fondi PAC 2023?",
      answer: "Per accedere ai fondi PAC 2023 è necessario soddisfare i seguenti requisiti: essere agricoltore attivo, rispettare la condizionalità...",
      sources: [
        {
          documentId: "doc1",
          documentTitle: "Regolamento PAC 2023-2027",
          relevantSection: "Art. 12 - Definizione di agricoltore attivo",
          confidence: 0.92
        }
      ],
      confidence: 0.89,
      feedback: "positive",
      timestamp: new Date("2024-01-20T10:30:00"),
      status: "answered"
    },
    {
      id: "2",
      userId: "user456",
      userType: "public",
      question: "Come ottenere la certificazione biologica?",
      answer: "Per ottenere la certificazione biologica devi seguire questi passi: contattare un organismo di controllo autorizzato...",
      sources: [
        {
          documentId: "doc2",
          documentTitle: "Guida Certificazione BIO",
          relevantSection: "Capitolo 3 - Procedura di certificazione",
          confidence: 0.88
        }
      ],
      confidence: 0.85,
      feedback: "negative",
      timestamp: new Date("2024-01-20T14:15:00"),
      status: "flagged"
    },
    {
      id: "3",
      userId: "user789",
      userType: "member",
      question: "Informazioni sui bandi PNRR per agrisolari?",
      answer: "I bandi PNRR per agrisolari prevedono contributi per l'installazione di impianti fotovoltaici...",
      sources: [
        {
          documentId: "doc3",
          documentTitle: "PNRR Agrisolare",
          relevantSection: "Sezione 2 - Criteri di ammissibilità",
          confidence: 0.91
        }
      ],
      confidence: 0.87,
      timestamp: new Date("2024-01-19T16:45:00"),
      status: "answered"
    }
  ]);

  const [filters, setFilters] = useState({
    search: "",
    userType: "all",
    status: "all",
    feedback: "all"
  });

  const { toast } = useToast();

  const filteredConversations = conversations.filter(conv => {
    return (
      (!filters.search || 
        conv.question.toLowerCase().includes(filters.search.toLowerCase()) ||
        conv.answer.toLowerCase().includes(filters.search.toLowerCase())) &&
      (filters.userType === "all" || conv.userType === filters.userType) &&
      (filters.status === "all" || conv.status === filters.status) &&
      (filters.feedback === "all" || conv.feedback === filters.feedback)
    );
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      answered: "bg-green-100 text-green-800",
      flagged: "bg-red-100 text-red-800",
      reviewed: "bg-blue-100 text-blue-800"
    };

    const icons = {
      answered: <CheckCircle className="h-3 w-3 mr-1" />,
      flagged: <AlertCircle className="h-3 w-3 mr-1" />,
      reviewed: <Eye className="h-3 w-3 mr-1" />
    };

    const labels = {
      answered: "Risposta",
      flagged: "Segnalata",
      reviewed: "Revisionata"
    };

    return (
      <Badge className={`flex items-center ${colors[status as keyof typeof colors]}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getUserTypeBadge = (userType: string) => {
    const colors = {
      public: "bg-gray-100 text-gray-800",
      member: "bg-green-100 text-green-800"
    };

    const labels = {
      public: "Pubblico",
      member: "Socio"
    };

    return (
      <Badge className={colors[userType as keyof typeof colors]}>
        {labels[userType as keyof typeof labels]}
      </Badge>
    );
  };

  const getFeedbackIcon = (feedback?: string) => {
    if (feedback === "positive") {
      return <ThumbsUp className="h-4 w-4 text-green-600" />;
    } else if (feedback === "negative") {
      return <ThumbsDown className="h-4 w-4 text-red-600" />;
    }
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  const markAsReviewed = (conversationId: string) => {
    toast({
      title: "Conversazione revisionata",
      description: "La conversazione è stata marcata come revisionata",
    });
  };

  const editResponse = (conversationId: string) => {
    toast({
      title: "Modifica risposta",
      description: "Apertura editor per modificare la risposta",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-green-800">Controllo Risposte Chatbot</h2>
        <p className="text-green-600">Monitora e migliora la qualità delle risposte generate</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-green-600">Conversazioni Totali</p>
              <p className="text-2xl font-bold text-green-800">{conversations.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <ThumbsUp className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-green-600">Feedback Positivi</p>
              <p className="text-2xl font-bold text-green-800">
                {conversations.filter(c => c.feedback === "positive").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm text-green-600">Da Rivedere</p>
              <p className="text-2xl font-bold text-green-800">
                {conversations.filter(c => c.status === "flagged").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-green-600">Confidenza Media</p>
              <p className="text-2xl font-bold text-green-800">
                {Math.round(conversations.reduce((acc, c) => acc + c.confidence, 0) / conversations.length * 100)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-green-600" />
            <Input
              placeholder="Cerca conversazioni..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="pl-10"
            />
          </div>
          
          <select 
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={filters.userType}
            onChange={(e) => setFilters({...filters, userType: e.target.value})}
          >
            <option value="all">Tutti gli utenti</option>
            <option value="public">Pubblico</option>
            <option value="member">Soci</option>
          </select>

          <select 
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="all">Tutti gli stati</option>
            <option value="answered">Risposte</option>
            <option value="flagged">Segnalate</option>
            <option value="reviewed">Revisionate</option>
          </select>

          <select 
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={filters.feedback}
            onChange={(e) => setFilters({...filters, feedback: e.target.value})}
          >
            <option value="all">Tutti i feedback</option>
            <option value="positive">Positivi</option>
            <option value="negative">Negativi</option>
          </select>
        </div>
      </Card>

      {/* Conversations Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Conversazione</TableHead>
              <TableHead>Utente</TableHead>
              <TableHead>Fonti</TableHead>
              <TableHead>Confidenza</TableHead>
              <TableHead>Feedback</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredConversations.map((conv) => (
              <TableRow key={conv.id}>
                <TableCell>
                  <div className="max-w-md">
                    <div className="flex items-start space-x-2 mb-2">
                      <User className="h-4 w-4 text-blue-600 mt-1" />
                      <p className="text-sm font-medium text-green-800">{conv.question}</p>
                    </div>
                    <div className="flex items-start space-x-2 ml-6">
                      <Bot className="h-4 w-4 text-green-600 mt-1" />
                      <p className="text-sm text-green-600">
                        {conv.answer.substring(0, 100)}...
                      </p>
                    </div>
                    <p className="text-xs text-green-500 mt-1">
                      {conv.timestamp.toLocaleDateString()} - {conv.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </TableCell>
                
                <TableCell>
                  {getUserTypeBadge(conv.userType)}
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    {conv.sources.map((source, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <FileText className="h-3 w-3 text-green-600" />
                        <div>
                          <p className="text-xs font-medium text-green-800">
                            {source.documentTitle}
                          </p>
                          <p className="text-xs text-green-600">
                            {source.relevantSection}
                          </p>
                          <div className="flex items-center space-x-1">
                            <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-600 rounded-full" 
                                style={{ width: `${source.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-green-600">
                              {Math.round(source.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-600 rounded-full" 
                        style={{ width: `${conv.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-green-600">
                      {Math.round(conv.confidence * 100)}%
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  {getFeedbackIcon(conv.feedback)}
                </TableCell>
                
                <TableCell>
                  {getStatusBadge(conv.status)}
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button size="sm" variant="outline" title="Visualizza">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      title="Modifica Risposta"
                      onClick={() => editResponse(conv.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {conv.status === "flagged" && (
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => markAsReviewed(conv.id)}
                        title="Marca come Revisionata"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
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
