const MovieSkeleton = () => {
  return (
    <div className="relative h-[28vw] w-[20vw] min-w-[150px] md:h-[12vw] md:w-[18vw] animate-pulse rounded-md bg-zinc-800">
      {/* Optional: Add a darker overlay or a subtle gradient to mimic the Netflix card depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/50 to-transparent"></div>
    </div>
  );
};
export default MovieSkeleton;