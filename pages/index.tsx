"use client";
import Billboard from "@/components/Billboard";
import InfoModel from "@/components/InfoModel";
import MovieList from "@/components/MovieList";
import Navbar from "@/components/Navbar";
import useCurrentUser from "@/hooks/useCurrentUser";
import useFavourites from "@/hooks/useFavourites";
import useModelInfo from "@/hooks/useModelInfo";
import useMovieList from "@/hooks/useMovieList";
import useSeriesList from "@/hooks/useSeriesList";
import SeriesList from "@/components/SeriesList";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import useWatchProgress from "@/hooks/useWatchProgress";
import { useSelectionStore } from "@/zustand/states/useSelectStore";
import { NextPageContext } from "next";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import SkelletonWrapper from "@/components/SkelletonWrapper";

export async function getServerSideProps(context: NextPageContext) {
  const session = await getSession(context);
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

export default function Home() {
  const { data: movies = [], isLoading } = useMovieList();
  const { data: seriesList = [], isLoading: isSeriesLoading } = useSeriesList();
  const { profile } = useSelectionStore();

  const { data: favMovies, isLoading: isFavLoading } = useFavourites({
    profileId: profile?.id,
  });

  const { data: continueWatching, isLoading: isContinueLoading, mutate: mutateContinue } = useWatchProgress(
    profile?.id
  );

  const { isOpen, closeModel } = useModelInfo();

  return (
    <>
      <InfoModel
        visible={isOpen}
        onClose={() => {
          closeModel;
        }}
      />
      <Navbar />
      <Billboard />
      <div className="pb-40">
        {/* Continue Watching */}
        {!isContinueLoading && continueWatching && continueWatching.length > 0 && (
          <ContinueWatchingRow
            data={continueWatching}
            onRemove={() => mutateContinue()}
          />
        )}

        {/* Trending Now */}
        {isLoading ? (
          <SkelletonWrapper title="Trending Now" />
        ) : (
          <MovieList title="Trending Now" data={movies} />
        )}

        {/* Favourites */}
        {isFavLoading ? (
          <SkelletonWrapper title="Favourites Movies" />
        ) : (
          <MovieList title="Favourites Movies" data={favMovies} />
        )}

        {/* Series */}
        {isSeriesLoading ? (
          <SkelletonWrapper title="Series" />
        ) : (
          <SeriesList title="Series" data={seriesList} />
        )}
      </div>
    </>
  );
}
