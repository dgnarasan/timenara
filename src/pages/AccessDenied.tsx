
import { Button } from "@/components/ui/button";
import { ShieldX, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted to-background p-4">
      <div className="text-center space-y-6 max-w-md mx-auto">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldX className="h-12 w-12 text-destructive" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
        
        <p className="text-muted-foreground">
          You don't have permission to access this page. 
          This area is restricted to administrators only.
        </p>
        
        <Button 
          onClick={() => navigate("/")} 
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default AccessDenied;
