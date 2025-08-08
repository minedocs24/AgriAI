
import { BackendHeader } from "@/components/backend/BackendHeader";
import { BackendNavigation } from "@/components/backend/BackendNavigation";

const Backend = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <BackendHeader />
      
      <main className="container mx-auto p-6">
        <BackendNavigation />
      </main>
    </div>
  );
};

export default Backend;
