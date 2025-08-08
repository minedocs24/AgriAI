
import { Card } from "@/components/ui/card";
import { 
  BarChart3,
  FileText,
  MessageSquare,
  TrendingUp,
  Users,
  Calendar,
  Target,
  Award
} from "lucide-react";

export const Dashboard = () => {
  const stats = {
    documentsThisMonth: 8,
    totalDocuments: 45,
    conversationsThisMonth: 234,
    totalConversations: 1567,
    activeUsers: 89,
    completionRate: 87,
    topTopics: [
      { name: "PAC 2023-2027", requests: 89, trend: "up" },
      { name: "Certificazione BIO", requests: 67, trend: "up" },
      { name: "PNRR Agrisolare", requests: 45, trend: "down" },
      { name: "IoT Agricoltura", requests: 34, trend: "up" },
      { name: "Finanziamenti UE", requests: 28, trend: "stable" }
    ],
    topDocuments: [
      { title: "Regolamento PAC 2023-2027", usage: 156, confidence: 0.92 },
      { title: "Guida Certificazione BIO", usage: 134, confidence: 0.88 },
      { title: "Bando PNRR Agrisolare", usage: 98, confidence: 0.85 },
      { title: "Normativa IoT Agricoltura", usage: 76, confidence: 0.90 }
    ],
    monthlyData: [
      { month: "Gen", documents: 5, conversations: 180 },
      { month: "Feb", documents: 8, conversations: 234 },
      { month: "Mar", documents: 12, conversations: 289 },
      { month: "Apr", documents: 6, conversations: 198 }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-green-800">Dashboard e Monitoraggio</h2>
        <p className="text-green-600">Panoramica delle attività e performance del sistema</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600">Documenti Questo Mese</p>
              <p className="text-2xl font-bold text-green-800">{stats.documentsThisMonth}</p>
              <p className="text-xs text-green-500">Totale: {stats.totalDocuments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-green-600">Conversazioni Questo Mese</p>
              <p className="text-2xl font-bold text-green-800">{stats.conversationsThisMonth}</p>
              <p className="text-xs text-green-500">Totale: {stats.totalConversations}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-green-600">Utenti Attivi</p>
              <p className="text-2xl font-bold text-green-800">{stats.activeUsers}</p>
              <p className="text-xs text-green-500">Ultimi 30 giorni</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Target className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-green-600">Tasso Completamento</p>
              <p className="text-2xl font-bold text-green-800">{stats.completionRate}%</p>
              <p className="text-xs text-green-500">Risposte soddisfacenti</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Activity Chart */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800">Attività Mensile</h3>
          </div>
          <div className="space-y-4">
            {stats.monthlyData.map((data, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-green-600">{data.month}</span>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <span className="text-sm text-green-800">{data.documents} doc</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-green-800">{data.conversations} chat</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Topics */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800">Argomenti Più Richiesti</h3>
          </div>
          <div className="space-y-3">
            {stats.topTopics.map((topic, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-green-800">{topic.name}</span>
                  {topic.trend === "up" && <TrendingUp className="h-3 w-3 text-green-600" />}
                  {topic.trend === "down" && <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />}
                </div>
                <span className="text-sm text-green-600">{topic.requests} richieste</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Documents Performance */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Award className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-green-800">Documenti Più Utilizzati</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-green-100">
                <th className="pb-2 text-sm font-medium text-green-700">Documento</th>
                <th className="pb-2 text-sm font-medium text-green-700">Utilizzi</th>
                <th className="pb-2 text-sm font-medium text-green-700">Confidenza</th>
                <th className="pb-2 text-sm font-medium text-green-700">Prestazioni</th>
              </tr>
            </thead>
            <tbody className="space-y-2">
              {stats.topDocuments.map((doc, index) => (
                <tr key={index} className="border-b border-green-50">
                  <td className="py-3 text-sm text-green-800">{doc.title}</td>
                  <td className="py-3 text-sm text-green-600">{doc.usage}</td>
                  <td className="py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-600 rounded-full" 
                          style={{ width: `${doc.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-green-600">
                        {Math.round(doc.confidence * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3">
                    {doc.confidence >= 0.9 ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Eccellente
                      </span>
                    ) : doc.confidence >= 0.8 ? (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Buono
                      </span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        Da migliorare
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Activities */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-green-800">Attività Recenti</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <FileText className="h-4 w-4 text-green-600" />
            <div className="flex-1">
              <p className="text-sm text-green-800">Nuovo documento caricato: "Guida PSR 2023"</p>
              <p className="text-xs text-green-600">2 ore fa</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm text-green-800">15 nuove conversazioni oggi</p>
              <p className="text-xs text-green-600">4 ore fa</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
            <Users className="h-4 w-4 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm text-green-800">3 nuovi utenti registrati</p>
              <p className="text-xs text-green-600">1 giorno fa</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
