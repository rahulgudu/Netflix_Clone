const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const movies = await prisma.movie.findMany({ take: 3 });
  console.log("MOVIES:");
  console.log(JSON.stringify(movies, null, 2));

  const series = await prisma.series.findMany({
    take: 3,
    include: {
      seasons: {
        include: {
          episodes: true
        }
      }
    }
  });
  console.log("SERIES:");
  console.log(JSON.stringify(series, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
