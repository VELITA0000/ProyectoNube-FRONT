import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import RegisterType from "./pages/RegisterType";
import Register from "./pages/Register";
import PhotographerLayout from "@/components/layout/PhotographerLayout";
import PhotographerClients from "./pages/photographer/Clients";
import MyPortfolio from "./pages/photographer/MyPortfolio";
import Portfolios from "./pages/photographer/Portfolios";
import PortfolioDetail from "./pages/photographer/PortfolioDetail";
import PhotographerHistory from "./pages/photographer/History";
import ClientLayout from "@/components/layout/ClientLayout";
import ClientPortfolios from "./pages/client/Sessions";
import ClientGallery from "./pages/client/Gallery";
import ClientCart from "./pages/client/Cart";
import ClientPurchases from "./pages/client/Purchases";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterType />} />
            <Route path="/register/details" element={<Register />} />

            {/* Photographer area */}
            <Route
              path="/studio"
              element={
                <ProtectedRoute role="photographer">
                  <PhotographerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PhotographerClients />} />
              <Route path="my-portfolio" element={<MyPortfolio />} />
              <Route path="portfolios" element={<Portfolios />} />
              <Route path="portfolios/:id" element={<PortfolioDetail />} />
              <Route path="history" element={<PhotographerHistory />} />
            </Route>

            {/* Client area */}
            <Route
              path="/client"
              element={
                <ProtectedRoute role="client">
                  <ClientLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ClientPortfolios />} />
              <Route path="portfolios/:id" element={<ClientGallery />} />
              <Route path="cart" element={<ClientCart />} />
              <Route path="purchases" element={<ClientPurchases />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
