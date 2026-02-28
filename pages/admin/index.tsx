"use client";

import { useRouter } from "next/navigation";
import { Film, MapPin, List } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();

  const cards = [
    {
      title: "Upload Movie",
      description: "Add new movies to the platform",
      icon: <Film size={40} />,
      route: "/admin/add-movies",
    },
    {
      title: "Add Region",
      description: "Create region categories",
      icon: <MapPin size={40} />,
      route: "/admin/add-regions",
    },
    {
      title: "View Uploaded Movies",
      description: "Manage existing movies",
      icon: <List size={40} />,
      route: "/admin/movies",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-12" onClick={() => router.push("/")}>
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => router.push(card.route)}
            className="bg-[#141414] p-8 rounded-lg cursor-pointer border border-gray-800 hover:border-red-600 transition-all duration-300 hover:scale-105">
            <div className="mb-6 text-red-600">{card.icon}</div>
            <h2 className="text-2xl font-semibold mb-3">{card.title}</h2>
            <p className="text-gray-400">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
