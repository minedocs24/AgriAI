
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users,
  Search,
  Edit,
  Shield,
  UserCheck,
  UserX,
  RotateCcw,
  Eye,
  Plus
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "public" | "member" | "manager";
  status: "active" | "suspended" | "pending";
  joinDate: Date;
  lastActivity: Date;
  conversationCount: number;
  documentsUploaded?: number;
}

export const UserManagement = () => {
  const [users] = useState<User[]>([
    {
      id: "1",
      name: "Mario Rossi",
      email: "mario.rossi@email.com",
      role: "member",
      status: "active",
      joinDate: new Date("2024-01-10"),
      lastActivity: new Date("2024-01-20"),
      conversationCount: 15
    },
    {
      id: "2",
      name: "Laura Bianchi",
      email: "laura.bianchi@email.com",
      role: "manager",
      status: "active",
      joinDate: new Date("2023-12-01"),
      lastActivity: new Date("2024-01-20"),
      conversationCount: 45,
      documentsUploaded: 12
    },
    {
      id: "3",
      name: "Giuseppe Verdi",
      email: "giuseppe.verdi@email.com",
      role: "member",
      status: "suspended",
      joinDate: new Date("2024-01-15"),
      lastActivity: new Date("2024-01-18"),
      conversationCount: 3
    },
    {
      id: "4",
      name: "Anna Neri",
      email: "anna.neri@email.com",
      role: "public",
      status: "pending",
      joinDate: new Date("2024-01-19"),
      lastActivity: new Date("2024-01-19"),
      conversationCount: 1
    }
  ]);

  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: ""
  });

  const filteredUsers = users.filter(user => {
    return (
      (!filters.search || 
        user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase())) &&
      (!filters.role || user.role === filters.role) &&
      (!filters.status || user.status === filters.status)
    );
  });

  const getRoleBadge = (role: string) => {
    const colors = {
      public: "bg-gray-100 text-gray-800",
      member: "bg-green-100 text-green-800",
      manager: "bg-blue-100 text-blue-800"
    };

    const labels = {
      public: "Pubblico",
      member: "Socio",
      manager: "Gestore"
    };

    return (
      <Badge className={colors[role as keyof typeof colors]}>
        {labels[role as keyof typeof labels]}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      suspended: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800"
    };

    const labels = {
      active: "Attivo",
      suspended: "Sospeso",
      pending: "In Attesa"
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const changeUserRole = (userId: string, newRole: string) => {
    console.log(`Changing user ${userId} role to ${newRole}`);
    // Implementation would update user role
  };

  const changeUserStatus = (userId: string, newStatus: string) => {
    console.log(`Changing user ${userId} status to ${newStatus}`);
    // Implementation would update user status
  };

  const resetPassword = (userId: string) => {
    console.log(`Resetting password for user ${userId}`);
    // Implementation would reset user password
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-green-800">Gestione Utenti</h2>
          <p className="text-green-600">Controlla accessi e ruoli degli utenti</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Utente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-green-600">Totale Utenti</p>
              <p className="text-2xl font-bold text-green-800">{users.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-green-600">Soci Attivi</p>
              <p className="text-2xl font-bold text-green-800">
                {users.filter(u => u.role === "member" && u.status === "active").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-green-600">Gestori</p>
              <p className="text-2xl font-bold text-green-800">
                {users.filter(u => u.role === "manager").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <UserX className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm text-green-600">In Attesa</p>
              <p className="text-2xl font-bold text-green-800">
                {users.filter(u => u.status === "pending").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-green-600" />
            <Input
              placeholder="Cerca utenti..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="pl-10"
            />
          </div>
          
          <select 
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={filters.role}
            onChange={(e) => setFilters({...filters, role: e.target.value})}
          >
            <option value="">Tutti i ruoli</option>
            <option value="public">Pubblico</option>
            <option value="member">Socio</option>
            <option value="manager">Gestore</option>
          </select>

          <select 
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">Tutti gli stati</option>
            <option value="active">Attivo</option>
            <option value="suspended">Sospeso</option>
            <option value="pending">In Attesa</option>
          </select>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utente</TableHead>
              <TableHead>Ruolo</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Attività</TableHead>
              <TableHead>Ultimo Accesso</TableHead>
              <TableHead>Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-green-800">{user.name}</p>
                    <p className="text-sm text-green-600">{user.email}</p>
                    <p className="text-xs text-green-500">
                      Iscritto il {user.joinDate.toLocaleDateString()}
                    </p>
                  </div>
                </TableCell>
                
                <TableCell>
                  {getRoleBadge(user.role)}
                </TableCell>
                
                <TableCell>
                  {getStatusBadge(user.status)}
                </TableCell>
                
                <TableCell>
                  <div>
                    <p className="text-sm text-green-800">
                      {user.conversationCount} conversazioni
                    </p>
                    {user.documentsUploaded && (
                      <p className="text-xs text-green-600">
                        {user.documentsUploaded} documenti caricati
                      </p>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <span className="text-sm text-green-600">
                    {user.lastActivity.toLocaleDateString()}
                  </span>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button size="sm" variant="outline" title="Visualizza">
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <select 
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                      value={user.role}
                      onChange={(e) => changeUserRole(user.id, e.target.value)}
                    >
                      <option value="public">Pubblico</option>
                      <option value="member">Socio</option>
                      <option value="manager">Gestore</option>
                    </select>
                    
                    <select 
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                      value={user.status}
                      onChange={(e) => changeUserStatus(user.id, e.target.value)}
                    >
                      <option value="active">Attivo</option>
                      <option value="suspended">Sospeso</option>
                      <option value="pending">In Attesa</option>
                    </select>
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => resetPassword(user.id)}
                      title="Reset Password"
                    >
                      <RotateCcw className="h-4 w-4" />
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
