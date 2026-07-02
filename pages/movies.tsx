"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Billboard from "@/components/Billboard";
import MovieList from "@/components/MovieList";
import useMovieList from "@/hooks/useMovieList";
import SkelletonWrapper from "@/components/SkelletonWrapper";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";

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

export default function MoviesPage() {
  const { data: movies = [], isLoading } = useMovieList();

  const actionMovies = movies.filter((m: any) =>
    m.genre?.toLowerCase().includes("action") || m.genre?.toLowerCase().includes("thriller")
  );
  const comedyMovies = movies.filter((m: any) =>
    m.genre?.toLowerCase().includes("comedy")
  );
  const dramaMovies = movies.filter((m: any) =>
    m.genre?.toLowerCase().includes("drama")
  );
  const romanceMovies = movies.filter((m: any) =>
    m.genre?.toLowerCase().includes("romance")
  );
  const others = movies.filter(
    (m: any) =>
      !m.genre?.toLowerCase().includes("action") &&
      !m.genre?.toLowerCase().includes("thriller") &&
      !m.genre?.toLowerCase().includes("comedy") &&
      !m.genre?.toLowerCase().includes("drama") &&
      !m.genre?.toLowerCase().includes("romance")
  );

  return (
    <>
      <Navbar />
      <Billboard />
      <div className="pb-40">
        {isLoading ? (
          <SkelletonWrapper title="Loading Movies" />
        ) : (
          <>
            {/* All Movies */}
            <MovieList title="Trending Movies" data={movies} />

            {/* Action */}
            {actionMovies.length > 0 && (
              <MovieList title="Action & Adventure" data={actionMovies} />
            )}

            {/* Comedy */}
            {comedyMovies.length > 0 && (
              <MovieList title="Comedies" data={comedyMovies} />
            )}

            {/* Drama */}
            {dramaMovies.length > 0 && (
              <MovieList title="Dramas" data={dramaMovies} />
            )}

            {/* Romance */}
            {romanceMovies.length > 0 && (
              <MovieList title="Romance Movies" data={romanceMovies} />
            )}

            {/* Others */}
            {others.length > 0 && others.length !== movies.length && (
              <MovieList title="More Movies" data={others} />
            )}
          </>
        )}
      </div>
    </>
  );
}
