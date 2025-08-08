
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText,
  MessageSquare,
  Users,
  BarChart3,
  Cog
} from "lucide-react";
import { DocumentManagement } from "./DocumentManagement";
import { ChatbotControl } from "./ChatbotControl";
import { UserManagement } from "./UserManagement";
import { Dashboard } from "./Dashboard";
import { SystemConfig } from "./SystemConfig";

export const BackendNavigation = () => {
  return (
    <Tabs defaultValue="documents" className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="documents" className="flex items-center space-x-2">
          <FileText className="h-4 w-4" />
          <span>Documenti</span>
        </TabsTrigger>
        <TabsTrigger value="chatbot" className="flex items-center space-x-2">
          <MessageSquare className="h-4 w-4" />
          <span>Chatbot</span>
        </TabsTrigger>
        <TabsTrigger value="users" className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <span>Utenti</span>
        </TabsTrigger>
        <TabsTrigger value="dashboard" className="flex items-center space-x-2">
          <BarChart3 className="h-4 w-4" />
          <span>Dashboard</span>
        </TabsTrigger>
        <TabsTrigger value="config" className="flex items-center space-x-2">
          <Cog className="h-4 w-4" />
          <span>Configurazioni</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="documents">
        <DocumentManagement />
      </TabsContent>

      <TabsContent value="chatbot">
        <ChatbotControl />
      </TabsContent>

      <TabsContent value="users">
        <UserManagement />
      </TabsContent>

      <TabsContent value="dashboard">
        <Dashboard />
      </TabsContent>

      <TabsContent value="config">
        <SystemConfig />
      </TabsContent>
    </Tabs>
  );
};
