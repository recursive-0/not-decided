import { createRootRoute, createRoute, Outlet } from "@tanstack/react-router"
import { Home } from "./features/Home/home"
import { App } from "./App"
import { DashboardLayout } from "./features/dashboard/dashboard-layout"


export const RootRoute = createRootRoute({
    component: () => (
        <div className="w-full h-full">
            <Outlet />
        </div>
        )
})


export const HomeRoute = createRoute({
    getParentRoute: () => RootRoute,
    path: "/",
    component: () => <Home />,
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