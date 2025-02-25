
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted to-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Authentication Removed</CardTitle>
          <CardDescription>
            Authentication has been removed from this application.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <p className="text-center mb-6">
            This page is now a placeholder since authentication functionality has been removed.
          </p>
          
          <Button 
            className="w-full" 
            onClick={() => navigate("/")}
          >
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
