import { useRouter } from "next/router";
import useSWR from "swr";
import Navbar from "@/components/Navbar";
import useCatMovies from "@/hooks/useCatMovies";
import NoData from "@/components/NoData";
import SkelletonWrapper from "@/components/SkelletonWrapper";

const CategoryPage = () => {
  const router = useRouter();
  const { category } = router.query;
  const { data: movies, isLoading } = useCatMovies(category as string);
  console.log(movies);
  if (!movies || movies.length === 0) {
    return (
      <>
        <Navbar />
        <NoData
          title="No movies found"
          description="Please check back later."
          onAction={() => router.push("/")}
          actionLabel="Go Home"
        />
      </>
    );
  }

  if (isLoading) {
    return <SkelletonWrapper title="Loading Movies" />;
  }
  return (
    <>
      <Navbar />

      <div className="pt-24 px-8">
        <h1 className="text-white text-3xl font-semibold capitalize mb-6">
          {category} Movies
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {movies?.map((movie: any) => (
            <div
              key={movie.id}
              className="cursor-pointer hover:scale-105 transition">
              <img src={movie.thumbnailUrl} className="rounded-md w-full" />

              <p className="text-white text-sm mt-2">{movie.title}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default CategoryPage;
