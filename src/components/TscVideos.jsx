import React, { useState } from "react";

const TscVideos = ({ tscVideos, setTscVideos }) => {
  const [videoInput, setVideoInput] = useState("");
  const [titleInput, setTitleInput] = useState("");

  const handleAddVideo = (e) => {
    if (!titleInput.trim() || !videoInput.trim()) return;
  
    const newVideos = [...tscVideos, { title: titleInput.trim(), url: videoInput.trim() }];
    console.log("Adding new video:", { title: titleInput.trim(), url: videoInput.trim() });
    console.log("Updated videos array:", newVideos);
  
    setTscVideos(newVideos);
    setTitleInput("");
    setVideoInput("");
  };

  return (
    <div className="w-full ">
      <p className="mb-2 font-semibold">TSC Videos</p>

      {/* Input Fields for Title and URL */}
      <div className="grid grid-cols-12 gap-2">
        <input
          type="text"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          className="col-span-5 px-3 py-2 border"
          placeholder="Enter video title..."
        />
        <input
          type="text"
          value={videoInput}
          onChange={(e) => setVideoInput(e.target.value)}
          className="col-span-5 px-3 py-2 border"
          placeholder="Paste video URL here..."
        />
        <button
          type="button"
          onClick={handleAddVideo}
          className="px-4 py-2 bg-black text-white rounded transition hover:bg-[#ff6667] hover:text-black grid-cols-1"
        >
          Add
        </button>
      </div>

      {/* Display Added Videos with Titles */}
      <div className="mt-4">
  {(tscVideos || []).map((video, index) => (
    <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded my-2">
      <div>
        <strong>{video.title}</strong> <br />
        <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-blue-600">
          {video.url}
        </a>
      </div>
      <button
        type="button"
        className="ml-2 bg-red-500 text-white px-2 py-1 rounded"
        onClick={() => setTscVideos(tscVideos.filter((_, i) => i !== index))}
      >
        ✖
      </button>
    </div>
  ))}
</div>
    </div>
  );
};

export default TscVideos;