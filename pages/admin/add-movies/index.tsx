"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { useRouter } from "next/router";
import useGetRegions from "@/hooks/useRegions";
import VideoUploader from "@/components/VideoUploader";
import ImageUploader from "@/components/ImageUploader";
import { useMovieStore } from "@/zustand/states/useMovieStore";
import { useMediaStore } from "@/zustand/states/useMediaStore";
import useCurrentUser from "@/hooks/useCurrentUser";

export default function AdminMoviesPage() {
    const { data: currentUser } = useCurrentUser();
    const router = useRouter();
    const setMovie = useMovieStore((state: any) => state.setMovie);
    const { videoId, thumbnailUrl } = useMediaStore()
    const [form, setForm] = useState({
        title: "",
        description: "",
        videoId: "",
        thumbnailUrl: "",
        genre: "",
        duration: "",
        regionId: "",
    });
    const { movie } = useMovieStore();
    const clearMovie = useMovieStore((state: any) => state.clearMovie);
    const clearMedia = useMediaStore((state: any) => state.clearMedia);

    useEffect(() => {
        if (movie) {
            setForm((prev) => ({
                ...prev,
                title: movie.title || "",
                description: movie.description || "",
                videoId: movie.videoId || "",
                thumbnailUrl: movie.thumbnailUrl || "",
                genre: movie.genre || "",
                duration: movie.duration || "",
                regionId: movie.regionId || "",
            }))
        }
    }, [movie])

    const { data: regionsData } = useGetRegions();


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("media", videoId, thumbnailUrl);

        const newData = {
            ...form,
            videoId: videoId,
            thumbnailUrl: thumbnailUrl,
        }
        setMovie(newData);
        alert("Movie uploaded successfully!");
        window.location.reload();
    };

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log(movie);
        const response = await axios.post(`/api/admin/movie?email=${currentUser?.email}`, movie);
        console.log(response);
        clearMovie();
        clearMedia()
        setForm({
            title: "",
            description: "",
            videoId: "",
            thumbnailUrl: "",
            genre: "",
            duration: "",
            regionId: "",
        });
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f0f] to-black text-white px-6 py-16">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-12">
                    <AiOutlineArrowLeft
                        onClick={() => router.back()}
                        className="text-gray-400 hover:text-white transition cursor-pointer"
                        size={22}
                    />
                    <div>
                        <h1 className="text-4xl font-bold tracking-wide">
                            Upload New Movie
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Add content to your streaming platform
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form
                    onSubmit={movie ? handlePublish : handleSubmit}
                    className="bg-[#141414]/80 backdrop-blur-md border border-gray-800 p-10 rounded-2xl space-y-8 shadow-2xl"
                >

                    {/* Title */}
                    <div>
                        <label className="block mb-2 text-sm text-gray-400">
                            Movie Title
                        </label>
                        <input
                            type="text"
                            placeholder="Enter movie title"
                            value={form.title}
                            onChange={(e) =>
                                setForm({ ...form, title: e.target.value })
                            }
                            required
                            className="w-full bg-[#1a1a1a] border border-gray-700 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none p-3 rounded-md transition"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block mb-2 text-sm text-gray-400">
                            Description
                        </label>
                        <textarea
                            placeholder="Enter movie description"
                            value={form.description}
                            onChange={(e) =>
                                setForm({ ...form, description: e.target.value })
                            }
                            required
                            rows={4}
                            className="w-full bg-[#1a1a1a] border border-gray-700 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none p-3 rounded-md transition"
                        />
                    </div>

                    {/* Video Upload */}
                    <div>
                        <label className="block mb-4 text-sm text-gray-400">
                            Upload Video
                        </label>
                        <VideoUploader />
                    </div>

                    {/* Thumbnail Upload */}
                    <div>
                        <label className="block mb-4 text-sm text-gray-400">
                            Upload Thumbnail
                        </label>
                        <ImageUploader />
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Genre */}
                        <div>
                            <label className="block mb-2 text-sm text-gray-400">
                                Genre
                            </label>
                            <input
                                type="text"
                                placeholder="Action, Comedy..."
                                value={form.genre}
                                onChange={(e) =>
                                    setForm({ ...form, genre: e.target.value })
                                }
                                required
                                className="w-full bg-[#1a1a1a] border border-gray-700 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none p-3 rounded-md transition"
                            />
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="block mb-2 text-sm text-gray-400">
                                Duration
                            </label>
                            <input
                                type="text"
                                placeholder="2h 15m"
                                value={form.duration}
                                onChange={(e) =>
                                    setForm({ ...form, duration: e.target.value })
                                }
                                required
                                className="w-full bg-[#1a1a1a] border border-gray-700 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none p-3 rounded-md transition"
                            />
                        </div>
                    </div>

                    {/* Region */}
                    <div>
                        <label className="block mb-2 text-sm text-gray-400">
                            Select Region
                        </label>
                        <select
                            value={form.regionId}
                            onChange={(e) =>
                                setForm({ ...form, regionId: e.target.value })
                            }
                            className="w-full bg-[#1a1a1a] border border-gray-700 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none p-3 rounded-md transition"
                        >
                            <option value="">Choose region</option>
                            {regionsData?.map(
                                ({ id, region }: { id: string; region: string }) => (
                                    <option key={id} value={id}>
                                        {region}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    {/* Submit */}
                    {
                        movie ? (

                            <button
                                type="submit"
                                className="w-full bg-red-600 hover:bg-red-700 active:scale-95 transition-all py-3 font-semibold rounded-lg shadow-lg shadow-red-900/30"
                            >
                                Publish Movie
                            </button>
                        ) : (

                            <button
                                type="submit"
                                className="w-full bg-red-600 hover:bg-red-700 active:scale-95 transition-all py-3 font-semibold rounded-lg shadow-lg shadow-red-900/30"
                            >
                                Upload Movie
                            </button>

                        )
                    }
                </form>
            </div>
        </div>
    );
}