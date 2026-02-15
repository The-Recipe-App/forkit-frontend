import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ContextPropsProvider } from "./features/Contexts";
import { Auth0Provider } from "@auth0/auth0-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <ReactQueryDevtools initialIsOpen={false} />
    <ContextPropsProvider>
      <Auth0Provider
        domain="forkit-oauth.eu.auth0.com"
        clientId="yRaevUwMPOY5938zax9xokPAgDCTvQac"
        authorizationParams={{
          redirect_uri: "http://localhost:5173/oauth/callback"
        }}
      >
        <App />
      </Auth0Provider>
    </ContextPropsProvider>
  </QueryClientProvider>
);
