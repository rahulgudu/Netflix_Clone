"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import SeriesCard from "@/components/SeriesCard";
import useSearch from "@/hooks/useSearch";
import SkelletonWrapper from "@/components/SkelletonWrapper";
import NoData from "@/components/NoData";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { useRouter } from "next/router";

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return {
      redirect: {
        destination: "/auth",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}

export default function SearchPage() {
  const router = useRouter();
  const { q } = router.query;

  const searchQuery = typeof q === "string" ? q.trim() : "";
  const { data: results = [], isLoading } = useSearch(searchQuery);

  return (
    <>
      <Navbar />
      <div className="pt-24 px-4 md:px-12 pb-40 min-h-screen bg-zinc-900">
        <h1 className="text-white text-xl md:text-3xl font-semibold mb-8">
          {searchQuery ? `Search results for "${searchQuery}"` : "Search"}
        </h1>

        {isLoading ? (
          <SkelletonWrapper title="Searching..." />
        ) : !searchQuery ? (
          <NoData
            title="Search for movies or series"
            description="Type name, genre, or region in the search bar above."
          />
        ) : results.length === 0 ? (
          <NoData
            title="No matches found"
            description={`We couldn't find any movies or series matching "${searchQuery}".`}
            onAction={() => router.push("/")}
            actionLabel="Go Home"
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-16 gap-x-4">
            {results.map((item: any) =>
              item.type === "series" ? (
                <SeriesCard key={`series-${item.id}`} data={item} />
              ) : (
                <MovieCard key={`movie-${item.id}`} data={item} />
              )
            )}
          </div>
        )}
      </div>
    </>
  );
}
