"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import useFavourites from "@/hooks/useFavourites";
import { useSelectionStore } from "@/zustand/useSelectStore";
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

export default function MyListPage() {
  const router = useRouter();
  const { profile } = useSelectionStore();

  const { data: favMovies = [], isLoading } = useFavourites({
    profileId: profile?.id,
  });

  return (
    <>
      <Navbar />
      <div className="pt-24 px-4 md:px-12 pb-40 min-h-screen bg-zinc-900">
        <h1 className="text-white text-2xl md:text-4xl font-bold mb-8">My List</h1>

        {isLoading ? (
          <SkelletonWrapper title="Loading My List" />
        ) : favMovies.length === 0 ? (
          <NoData
            title="Your list is empty"
            description="Explore movies and add them to your list to see them here!"
            onAction={() => router.push("/")}
            actionLabel="Browse Movies"
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-16 gap-x-4">
            {favMovies.map((movie: any) => (
              <MovieCard key={movie.id} data={movie} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
