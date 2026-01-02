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


function App() {
  const publicRoutes = [
    { index: true, path: "/", element: <Home /> },
    { path: "/register", element: <Register /> },
    { path: "/login", element: <Login /> },
    { path: "/privacy", element: <Privacy /> },
    { path: "/terms", element: <Terms /> },
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
