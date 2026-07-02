import { BsBell, BsChevronDown, BsSearch } from "react-icons/bs";
import NavbarItems from "./NavbarItems";
import MobileMenu from "./MobileMenu";
import { useCallback, useEffect, useState } from "react";
import AccountMenu from "./AccountMenu";
import { useSelectionStore } from "@/zustand/useSelectStore";
import useCurrentUser from "@/hooks/useCurrentUser";
import Link from "next/link";
import CategoriesDropdown from "./CategoriesDropdown";
import { useRouter } from "next/router";

const TOP_OFFSET = 66;

const Navbar = () => {
  const [showMobile, setShowMobile] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showBackground, setShowBackground] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Keep input in sync with URL if user navigates directly or goes back/forward
  useEffect(() => {
    if (router.pathname === "/search") {
      setShowSearch(true);
      if (typeof router.query.q === "string") {
        setSearchQuery(router.query.q);
      }
    }
  }, [router.pathname, router.query.q]);

  const toggleMobileMenu = useCallback(() => {
    setShowMobile((current) => !current);
  }, []);

  const toggleAccountMenu = useCallback(() => {
    setShowAccount((current) => !current);
  }, []);

  const handleSearchToggle = () => {
    setShowSearch((prev) => {
      const nextVal = !prev;
      if (!nextVal) {
        setSearchQuery("");
        router.push("/");
      } else {
        router.push("/search");
      }
      return nextVal;
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    router.push(
      {
        pathname: "/search",
        query: { q: value },
      },
      undefined,
      { shallow: true }
    );
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowBackground(window.scrollY >= TOP_OFFSET);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { profile, user } = useSelectionStore();
  const { data: currentUser } = useCurrentUser();

  return (
    <nav className="w-full fixed z-40">
      <div
        className={`px-4 md:px-8 flex items-center h-16 transition duration-500 ${
          showBackground ? "bg-zinc-900 bg-opacity-90" : ""
        }`}
      >
        {/* LEFT SECTION */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link href="/">
            <img className="h-8 lg:h-32 cursor-pointer" src="/images/logo.png" alt="Logo" />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-7">
            <Link href="/">
              <NavbarItems label="Home" />
            </Link>
            <Link href="/series">
              <NavbarItems label="Series" />
            </Link>
            <Link href="/movies">
              <NavbarItems label="Movies" />
            </Link>
            <Link href="/my-list">
              <NavbarItems label="My List" />
            </Link>

            <div className="relative group">
              <NavbarItems label="Categories" />
              <CategoriesDropdown />
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="lg:hidden flex items-center gap-5">
            <div
              onClick={toggleMobileMenu}
              className="flex items-center cursor-pointer gap-1 relative"
            >
              <p className="text-white text-sm">Browse</p>
              <BsChevronDown
                className={`text-white transition ${
                  showMobile ? "rotate-180" : ""
                }`}
              />
              <MobileMenu visible={showMobile} />
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-5 ml-auto">
          {/* Expandable Search Input */}
          <div className="flex items-center gap-2 relative">
            <button
              onClick={handleSearchToggle}
              className="text-gray-200 hover:text-gray-300 transition focus:outline-none flex items-center"
            >
              <BsSearch className="text-lg cursor-pointer" />
            </button>
            <div
              className={`transition-all duration-300 overflow-hidden flex items-center bg-zinc-900/90 border border-white/20 rounded-md px-2 py-1 ${
                showSearch ? "w-40 md:w-56 opacity-100" : "w-0 opacity-0 pointer-events-none border-transparent"
              }`}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Titles, genres, regions..."
                className="bg-transparent text-white text-xs md:text-sm focus:outline-none w-full placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    router.push(
                      {
                        pathname: "/search",
                        query: { q: "" },
                      },
                      undefined,
                      { shallow: true }
                    );
                  }}
                  className="text-gray-400 hover:text-white transition ml-1 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <BsBell className="text-gray-200 hover:text-gray-300 cursor-pointer text-lg" />

          <div
            onClick={toggleAccountMenu}
            className="flex items-center gap-2 cursor-pointer relative"
          >
            <div className="w-7 h-7 lg:w-9 lg:h-9 rounded-md overflow-hidden">
              <img
                src={
                  user?.image || profile?.image || "/images/default-avatar.png"
                }
              />
            </div>

            <BsChevronDown
              className={`text-white transition ${
                showAccount ? "rotate-180" : ""
              }`}
            />

            <AccountMenu visible={showAccount} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
