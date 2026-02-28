"use client"
import Billboard from "@/components/Billboard";
import InfoModel from "@/components/InfoModel";
import MovieList from "@/components/MovieList";
import Navbar from "@/components/Navbar";
import useCurrentUser from "@/hooks/useCurrentUser";
import useFavourites from "@/hooks/useFavourites";
import useModelInfo from "@/hooks/useModelInfo";
import useMovieList from "@/hooks/useMovieList";
import { useSelectionStore } from "@/zustand/states/useSelectStore";
import { NextPageContext } from "next";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
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
  // const router = useRouter()
  // for codespaces
  // const { data: currentUser, isLoading } = useCurrentUser();
  // useEffect(() => {
  //   if (!isLoading && !currentUser) {
  //     router.push("/auth");
  //   }
  // }, [isLoading, currentUser, router]);
  // --end--


  const { data: movies = [] } = useMovieList();
  const { data: favMovies = [] } = useFavourites();
  const { isOpen, closeModel } = useModelInfo();
  

  return (
    <>
      <InfoModel visible={isOpen} onClose={() => { closeModel }} />
      <Navbar />
      <Billboard />
      <div className="pb-40">
        <MovieList title="Trending Now" data={movies} />
        <MovieList title="Favourites Movies" data={favMovies} />
      </div>
    </>
  );
}
