"use client";

import { useRouter } from "next/router";
import { Film, MapPin, List, Tv, PlaySquare, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session } = useSession();

  const cards = [
    {
      title: "Upload Movie",
      description: "Add new standalone movies to the platform",
      icon: <Film size={40} />,
      route: "/admin/add-movies",
    },
    {
      title: "Upload Series",
      description: "Add new TV shows with seasons and episodes",
      icon: <Tv size={40} />,
      route: "/admin/add-series", // Ensure this matches your route
    },
    {
      title: "Add Region",
      description: "Create and manage regional categories",
      icon: <MapPin size={40} />,
      route: "/admin/add-regions",
    },
    {
      title: "Manage Movies",
      description: "Edit, update, or remove existing movies",
      icon: <List size={40} />,
      route: "/admin/movies",
    },
    {
      title: "Manage Series",
      description: "Handle series, seasons, and episode updates",
      icon: <PlaySquare size={40} />,
      route: "/admin/manage-series",
    },
  ];

  return (
    <div className="min-h-screen bg-[#141414] text-white p-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <h1
              className="text-5xl font-extrabold mb-1 cursor-pointer text-[#E50914] tracking-tighter"
              onClick={() => router.push("/")}
            >
              NETFLIX <span className="text-white font-light text-3xl ml-2">Admin</span>
            </h1>
            <p className="text-zinc-400 text-lg">Content Management System</p>
          </div>

          {/* Logout */}
          <div className="flex flex-col items-end gap-2 pt-1">
            {session?.user?.email && (
              <span className="text-zinc-500 text-xs truncate max-w-[200px]">
                {session.user.email}
              </span>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/auth" })}
              className="group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 transition-all duration-200 hover:text-white"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(229,9,20,0.12)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(229,9,20,0.4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
              }}
            >
              <LogOut size={16} className="transition-transform group-hover:-translate-x-0.5" />
              Sign Out
            </button>
          </div>
        </div>


        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <div
              key={index}
              onClick={() => router.push(card.route)}
              className="group bg-[#181818] p-8 rounded-md cursor-pointer border border-zinc-800 
                         hover:border-zinc-500 transition-all duration-300 
                         hover:bg-[#232323] relative overflow-hidden"
            >
              {/* Netflix Red Accent Line on Hover */}
              <div className="absolute top-0 left-0 w-full h-1 bg-[#E50914] opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="mb-6 text-[#E50914] group-hover:scale-110 transition-transform duration-300">
                {card.icon}
              </div>
              
              <h2 className="text-2xl font-bold mb-3 group-hover:text-white transition-colors">
                {card.title}
              </h2>
              
              <p className="text-zinc-500 group-hover:text-zinc-300 leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
    </div>
  );
}