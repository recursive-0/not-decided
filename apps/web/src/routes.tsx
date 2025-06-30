import { GoogleOAuthProvider } from "@react-oauth/google"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRootRoute, createRoute, Outlet } from "@tanstack/react-router"
import { App } from "./App"
import { DashboardLayout } from "./features/dashboard/dashboard-layout"
import WrisorLandingHero from "./features/Home/home"
import { Login } from "./features/login"

const queryClient = new QueryClient()


export const RootRoute = createRootRoute({
    component: () => (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <QueryClientProvider client={queryClient}>
        <div className="w-full h-full">
            <Outlet />
        </div>
        </QueryClientProvider>
        </GoogleOAuthProvider>
        )
})


export const HomeRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: "/",
    component: () => <WrisorLandingHero />,
})

export const LoginRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: "/login",
    component: Login
})

export const DashboardRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: "/dashboard",
    component: () => <DashboardLayout />
})

export const DocumentRoute = createRoute({
    getParentRoute: () => DashboardRoute,
    path: "/document/$documentId",
    component: () =>  <App />
})