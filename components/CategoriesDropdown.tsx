import Link from "next/link";

const CategoriesDropdown = () => {
  return (
    <div className="absolute top-8 left-0 bg-black border border-gray-800 rounded-md py-2 w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-200">
      <Link href="/category/drama" className="block px-4 py-2 text-white hover:bg-gray-800">
        Drama
      </Link>
      <Link href="/category/comedy" className="block px-4 py-2 text-white hover:bg-gray-800">
        Comedy
      </Link>
      <Link href="/category/romance" className="block px-4 py-2 text-white hover:bg-gray-800">
        Romance
      </Link>
      <Link href="/category/thriller" className="block px-4 py-2 text-white hover:bg-gray-800">
        Thriller
      </Link>
    </div>
  );
};

export default CategoriesDropdown;