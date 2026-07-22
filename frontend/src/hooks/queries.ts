import { useQuery } from "@tanstack/react-query";

import { getCategories, getOrderMonths, getOrders, getProducts } from "../api/portal";

export const queryKeys = {
  products: ["products"] as const,
  categories: ["categories"] as const,
  orders: (includeDeleted: boolean, month?: string) =>
    ["orders", includeDeleted, month ?? "all"] as const,
  orderMonths: ["orders", "months"] as const,
};

export const useProducts = () =>
  useQuery({ queryKey: queryKeys.products, queryFn: getProducts });

export const useCategories = () =>
  useQuery({
    queryKey: queryKeys.categories,
    queryFn: getCategories,
    select: (list) => list.map((c) => c.label),
  });

export const useOrders = (includeDeleted = false, month?: string) =>
  useQuery({
    queryKey: queryKeys.orders(includeDeleted, month),
    queryFn: () => getOrders(includeDeleted, month),
  });

export const useOrderMonths = () =>
  useQuery({ queryKey: queryKeys.orderMonths, queryFn: getOrderMonths });
