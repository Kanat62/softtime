import { QueryClient, QueryCache } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { routeTree } from "../../routeTree.gen";
import { normalizeError } from "@/shared/api/error";

export const getRouter = () => {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        const { statusCode, message } = normalizeError(error);
        if (statusCode === 401 || statusCode === 0) return; // handled by interceptors / network already shown
        toast.error(message);
      },
    }),
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
