import { BsBell, BsChevronDown, BsSearch } from "react-icons/bs";
import NavbarItems from "./NavbarItems";
import MobileMenu from "./MobileMenu";
import { useCallback, useEffect, useState } from "react";
import AccountMenu from "./AccountMenu";
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
      if (window.scrollY >= TOP_OFFSET) {
        setShowBackground(true);
      } else {
        setShowBackground(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <nav className="w-full fixed z-40">
      <div
        className={`md:px-2 -mt-5 flex flex-row items-center transition duration-500 ${
          showBackground ? "bg-zinc-900 bg-opacity-90" : ""
        }`}>
        <img className="h-28" src="/images/logo.png" />

        <div className="flex-row ml-8 gap-7 hidden lg:flex">
          <NavbarItems label="Home" />
          <NavbarItems label="Series" />
          <NavbarItems label="Films" />
          <NavbarItems label="New & Popular" />
          <NavbarItems label="My List" />
          <NavbarItems label="Browse by languages" />
        </div>

        <div
          onClick={toggleMobileMenu}
          className="lg:hidden flex flex-row items-center cursor-pointer gap-2 ml-8 relative">
          <p className="text-white text-sm">Browse</p>
          <BsChevronDown
            className={`text-white transition ${showMobile && "rotate-180"}`}
          />

          <MobileMenu visible={showMobile} />
        </div>

        <div className="flex flex-row ml-auto items-center">
          <div className="text-gray-200 hover:text-gray-300 cursor-pointe transition">
            <BsSearch className="mr-12" />
          </div>
          <div className="text-gray-200 hover:text-gray-300 cursor-pointe transition">
            <BsBell className="mr-12" />
          </div>
          <div
            onClick={toggleAccountMenu}
            className="flex flex-row items-center gap-2 cursor-pointer relative mr-12">
            <div className="w-6 h-6 lg:w-10 lg:h-10 rounded-md overflow-hidden">
              <img src={"/images/default-avatar.png"} />
            </div>
            <BsChevronDown
              className={`text-white transition ${showAccount && "rotate-180"}`}
            />
            <AccountMenu visible={showAccount} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
