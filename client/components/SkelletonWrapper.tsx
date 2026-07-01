import MovieSkeleton from "./MovieSkeleton";

const SkelletonWrapper = ({ title }: { title?: string }) => {
  return (
    <div className="space-y-4 px-4 md:px-12 mt-4">
      <p className="text-white text-md md:text-xl lg:text-2xl font-semibold mb-4">
        {title}
      </p>
      <div className="flex flex-row items-center gap-2 overflow-x-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <MovieSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};

export default SkelletonWrapper;