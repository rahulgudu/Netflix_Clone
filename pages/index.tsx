"use client";
import React, { useEffect } from "react";
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
import { useSelectionStore } from "@/zustand/useSelectStore";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { useRouter } from "next/router";
import SkelletonWrapper from "@/components/SkelletonWrapper";
import useRegions from "@/hooks/useRegions";

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

export default function Home() {
  const { data: movies = [], isLoading } = useMovieList();
  const { data: seriesList = [], isLoading: isSeriesLoading } = useSeriesList();
  const { profile } = useSelectionStore();
  const { data: regions = [], isLoading: isRegionsLoading } = useRegions();

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

        {/* Region Content */}
        {!isRegionsLoading && regions?.map((region: any) => (
          <React.Fragment key={region.id}>
            {region.movies && region.movies.length > 0 && (
              <MovieList title={`${region.region} Movies`} data={region.movies} />
            )}
            {region.series && region.series.length > 0 && (
              <SeriesList title={`${region.region} Series`} data={region.series} />
            )}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}
