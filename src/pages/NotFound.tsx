import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Home, AlertTriangle } from "lucide-react";

const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
    <div className="p-4 rounded-full bg-destructive/10">
      <AlertTriangle className="h-16 w-16 text-destructive" />
    </div>
    <div className="text-center space-y-2">
      <h1 className="text-4xl font-bold text-foreground">404</h1>
      <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
      <p className="text-muted-foreground max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
    </div>
    <Button asChild size="lg">
      <Link to="/">
        <Home className="mr-2 h-4 w-4" />
        Go Home
      </Link>
    </Button>
  </div>
);

export default NotFound;
