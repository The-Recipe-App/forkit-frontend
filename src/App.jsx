import { React } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import store from "./store";
import Home from "./pages/Home";
import MainAppLayout from "./layouts/MainAppLayout";
import { ContextProvider  } from "./features/ContextProvider";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Recipes from "./pages/Recipes";
import RecipeDetail from "./pages/RecipeDetail";
import ForkEditor from "./pages/ForkEditor";
import ProfileDashboard from "./pages/ProfileDashboard";
import ActivateAccount from "./pages/ActivateAccount";
import OAuthCallback from "./pages/OAuthCallback";

function App() {
  const publicRoutes = [
    { index: true, path: "/", element: <Home /> },
    { path: "/register", element: <Register /> },
    { path: "/login", element: <Login /> },
    { path: "/privacy", element: <Privacy /> },
    { path: "/terms", element: <Terms /> },
    { path: "/recipes", element: <Recipes /> },
    { path: "/recipes/:id", element: <RecipeDetail /> },
    { path: "/recipes/:id/fork", element: <ForkEditor /> },
    { path: "/profile", element: <ProfileDashboard /> },
    { path: "/profile/:username", element: <ProfileDashboard /> },
    { path: "/activate-account*", element: <ActivateAccount /> },
    { path: "/oauth/callback", element: <OAuthCallback /> },
  ];


  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <ContextProvider>
          <MainAppLayout />
        </ContextProvider>
      ),
      children: publicRoutes,
    },
  ]);


  return (
    <Provider store={store}>
      <Toaster position="top-right" reverseOrder={false} />
      <RouterProvider router={router} />
    </Provider>
  );
}

export default App;
