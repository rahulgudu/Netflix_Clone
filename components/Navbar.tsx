import { BsBell, BsChevronDown, BsSearch } from "react-icons/bs";
import NavbarItems from "./NavbarItems";
import MobileMenu from "./MobileMenu";
import { useCallback, useEffect, useState } from "react";
import AccountMenu from "./AccountMenu";
import { useSelectionStore } from "@/zustand/states/useSelectStore";
import useCurrentUser from "@/hooks/useCurrentUser";
import Link from "next/link";
import CategoriesDropdown from "./CategoriesDropdown";

const TOP_OFFSET = 66;

const Navbar = () => {
  const [showMobile, setShowMobile] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showBackground, setShowBackground] = useState(false);

  const toggleMobileMenu = useCallback(() => {
    setShowMobile((current) => !current);
  }, []);

  const toggleAccountMenu = useCallback(() => {
    setShowAccount((current) => !current);
  }, []);

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
          <img className="h-8 lg:h-32" src="/images/logo.png" />

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-7">
            <NavbarItems label="Home" />
            <NavbarItems label="Series" />
            <NavbarItems label="Movies" />
            <NavbarItems label="My List" />

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

            <div className="relative group flex items-center gap-1 cursor-pointer">
              <p className="text-white text-sm">Categories</p>
              <BsChevronDown className="text-white text-xs" />

              <div className="absolute top-6 left-0 bg-black border border-gray-800 rounded-md py-2 w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-200">
                <Link
                  href="/category/drama"
                  className="block px-4 py-2 text-white hover:bg-gray-800"
                >
                  Drama
                </Link>
                <Link
                  href="/category/comedy"
                  className="block px-4 py-2 text-white hover:bg-gray-800"
                >
                  Comedy
                </Link>
                <Link
                  href="/category/romance"
                  className="block px-4 py-2 text-white hover:bg-gray-800"
                >
                  Romance
                </Link>
                <Link
                  href="/category/thriller"
                  className="block px-4 py-2 text-white hover:bg-gray-800"
                >
                  Thriller
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-5 ml-auto">
          {currentUser?.role === "admin" && (
            <Link
              href="/admin"
              className="bg-red-600 py-1 px-3 rounded-md text-sm hidden md:block"
            >
              Admin
            </Link>
          )}

          <BsSearch className="text-gray-200 hover:text-gray-300 cursor-pointer text-lg" />
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
