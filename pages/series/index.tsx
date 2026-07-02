"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import SeriesBillboard from "@/components/SeriesBillboard";
import SeriesList from "@/components/SeriesList";
import useSeriesList from "@/hooks/useSeriesList";
import SkelletonWrapper from "@/components/SkelletonWrapper";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";

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

export default function SeriesPage() {
  const { data: seriesList = [], isLoading } = useSeriesList();

  const dramas = seriesList.filter((s: any) =>
    s.genre?.toLowerCase().includes("drama")
  );
  const comedies = seriesList.filter((s: any) =>
    s.genre?.toLowerCase().includes("comedy")
  );
  const thrillers = seriesList.filter((s: any) =>
    s.genre?.toLowerCase().includes("thriller")
  );
  const others = seriesList.filter(
    (s: any) =>
      !s.genre?.toLowerCase().includes("drama") &&
      !s.genre?.toLowerCase().includes("comedy") &&
      !s.genre?.toLowerCase().includes("thriller")
  );

  return (
    <>
      <Navbar />
      <SeriesBillboard />
      <div className="pb-40">
        {isLoading ? (
          <SkelletonWrapper title="Loading Series" />
        ) : (
          <>
            {/* All Series */}
            <SeriesList title="Trending Series" data={seriesList} />

            {/* Dramas */}
            {dramas.length > 0 && <SeriesList title="Drama Series" data={dramas} />}

            {/* Comedies */}
            {comedies.length > 0 && (
              <SeriesList title="Comedy Series" data={comedies} />
            )}

            {/* Thrillers */}
            {thrillers.length > 0 && (
              <SeriesList title="Action & Thriller Series" data={thrillers} />
            )}

            {/* Other Series */}
            {others.length > 0 && others.length !== seriesList.length && (
              <SeriesList title="More Series" data={others} />
            )}
          </>
        )}
      </div>
    </>
  );
}
