import { createRouter } from "@tanstack/react-router";
import { DashboardRoute, DocumentRoute, HomeRoute, LoginRoute, RootRoute } from "./routes";



const routeTree = RootRoute.addChildren([HomeRoute, LoginRoute, DashboardRoute, DocumentRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}