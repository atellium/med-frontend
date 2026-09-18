"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getDoctors } from "./provider.service";

export function useDoctorList({
  specialty,
  lat,
  lng,
  availableToday = false,
}: {
  specialty?: string;
  lat: number | null;
  lng: number | null;
  availableToday?: boolean;
}) {
  return useInfiniteQuery({
    queryKey: ["doctors", specialty ?? "all", lat, lng, availableToday],
    queryFn: ({ pageParam }) =>
      getDoctors({
        specialty,
        lat: lat!,
        lng: lng!,
        availableToday,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.has_next ? lastPage.pagination.page + 1 : undefined,
    enabled: lat !== null && lng !== null,
  });
}
