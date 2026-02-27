"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { useRouter } from "next/router";
import useGetRegions from "@/hooks/useRegions";

type Region = {
    id: string;
    region: string;
};

export default function AdminMoviesPage() {
    const router = useRouter()
    const [form, setForm] = useState({
        title: "",
        description: "",
        videoUrl: "",
        thumbnailUrl: "",
        genre: "",
        duration: "",
        regionId: "",
    });

    const { data: regionsData } = useGetRegions();
    // console.log(regionsData);





    //   useEffect(() => {
    //     const fetchRegions = async () => {
    //       const res = await axios.get("/api/admin/regions");
    //       setRegions(res.data);
    //     };
    //     fetchRegions();
    //   }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await axios.post("/api/admin/movies", form);
        alert("Movie uploaded successfully!");
        setForm({
            title: "",
            description: "",
            videoUrl: "",
            thumbnailUrl: "",
            genre: "",
            duration: "",
            regionId: "",
        });
    };

    return (
        <div className="min-h-screen bg-black text-white p-10">
            <div className="flex items-center mb-8 gap-2">
                <AiOutlineArrowLeft
                    onClick={() => router.back()}
                    className="text-white cursor-pointer"
                    size={20}
                />
                <h1 className="text-3xl font-bold">Upload New Movie</h1>
            </div>
            <form
                onSubmit={handleSubmit}
                className=" bg-[#141414] p-8 rounded-md space-y-6"
            >
                <input
                    type="text"
                    placeholder="Title"
                    className="w-full bg-black border border-gray-700 p-3"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                />

                <textarea
                    placeholder="Description"
                    className="w-full bg-black border border-gray-700 p-3"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                />

                <div>
                    <label className="block mb-2">Video</label>
                    <input
                        type="file"
                        accept="video/*"
                        onChange={async (e) => {
                            if (!e.target.files) return;
                            const url = await handleFileUpload(
                                e.target.files[0],
                                "video"
                            );
                            setForm({ ...form, videoUrl: url });
                        }}
                        className="w-full bg-black border border-gray-700 p-3"
                    />

                    {form.videoUrl && (
                        <p className="mt-3 text-green-500 text-sm">
                            Video uploaded successfully
                        </p>
                    )}
                </div>

                <div>
                    <label className="block mb-2">Thumbnail</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                            if (!e.target.files) return;
                            const url = await handleFileUpload(
                                e.target.files[0],
                                "image"
                            );
                            setForm({ ...form, thumbnailUrl: url });
                        }}
                        className="w-full bg-black border border-gray-700 p-3"
                    />

                    {form.thumbnailUrl && (
                        <img
                            src={form.thumbnailUrl}
                            className="mt-3 w-48 rounded"
                        />
                    )}
                </div>

                <input
                    type="text"
                    placeholder="Genre (Action, Comedy...)"
                    className="w-full bg-black border border-gray-700 p-3"
                    value={form.genre}
                    onChange={(e) => setForm({ ...form, genre: e.target.value })}
                    required
                />

                <input
                    type="text"
                    placeholder="Duration (2h 15m)"
                    className="w-full bg-black border border-gray-700 p-3"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    required
                />

                <select
                    className="w-full bg-black border border-gray-700 p-3"
                    value={form.regionId}
                    onChange={(e) => setForm({ ...form, regionId: e.target.value })}
                >
                    <option value="">Select Region</option>
                    {regionsData?.map(({ _id, region }: { _id: string, region: string }) => (
                        <option key={_id} value={_id}>
                            {region}
                        </option>
                    ))}
                </select>

                <button className="w-full bg-red-600 hover:bg-red-700 py-3 font-semibold">
                    Upload Movie
                </button>
            </form>
        </div>
    );
}