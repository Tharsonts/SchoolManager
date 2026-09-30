import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Router from "@/components/Router";
import RenderWakePage from "@/pages/RenderWakePage";

function App() {
  if (window.location.hostname.endsWith(".github.io")) {
    return <RenderWakePage />;
  }

  return (
    <TooltipProvider>
      <Toaster />
      <SonnerToaster richColors position="top-right" />
      <Router />
    </TooltipProvider>
  );
}

export default App;
