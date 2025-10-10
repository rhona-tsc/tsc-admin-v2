import React from 'react';
import OriginalActName from '../OriginalActName';
import TscName from '../TscName';
import ImageUpload from '../ImageUpload';
import Videos from '../Videos';
import Mp3s from '../Mp3s';
import ActDescription from '../ActDescription';
import ActBio from '../ActBio';
import TscBio from '../TscBio';
import TscVideos from '../TscVideos';
import TscActDescription from '../TscActDescription'; // ← make sure this exists
import CoverImageUpload from '../CoverImageUpload';
import ProfileImageUpload from '../ProfileImageUpload'; // ← make sure this exists

const StepOne = ({
  name,
  setName,
  tscName,
  setTscName,
  images,
  setImages,
  coverImage,
  setCoverImage,
  profileImage,
  setProfileImage,
  videos,
  setVideos,
  tscVideos,
  setTscVideos,
  mp3s,
  setMp3s,
  description,
  setDescription,
  tscDescription,
  setTscDescription,
  bio,
  setBio,
  tscBio,
  setTscBio,
  userEmail,
userRole,
  isChanged,
  markChanged,
  genre,
  lineupSize,
  bandMembers,
}) => {
  console.log("🔍 StepOne userEmail:", userEmail);
  console.log("🔍 StepOne userRole:", userRole);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Step 1: Tell Us About Your Act</h2>

      {/* Act Name and TSC Name */}
      <div className="flex flex-row gap-4">
        <OriginalActName
          name={name}
          setName={(val) => {
            setName(val);
            markChanged('name');
          }}
          className={isChanged('name') ? 'border-yellow-400 bg-yellow-50' : ''}
        />
         {userRole?.includes("agent") && (
          <TscName
            tscName={tscName}
            setTscName={(val) => {
              setTscName(val);
              markChanged('tscName');
            }}
            className={isChanged('tscName') ? 'border-yellow-400 bg-yellow-50' : ''}
          />
        )}
      </div>

      {/* Images */}
      <ImageUpload
        images={images}
        setImages={(val) => {
          setImages(val);
          markChanged('images');
        }}
        tscName={tscName}
        genres={genre}
        bandMembers={bandMembers}
        lineupSize={lineupSize}
        highlight={isChanged('images')}
      />

       <div className="flex flex-1 gap-6">  {/* Images */}
           <ProfileImageUpload
        profileImage={profileImage}
        setProfileImage={(val) => {
          setProfileImage(val);
          markChanged('profileImage');
        }}
        tscName={tscName}
        genres={genre}
        bandMembers={bandMembers}
        lineupSize={lineupSize}
        highlight={isChanged('images')}
      />
       <CoverImageUpload
        coverImage={coverImage}
        setCoverImage={(val) => {
          setCoverImage(val);
          markChanged('coverImage');
        }}
        tscName={tscName}
        genres={genre}
        bandMembers={bandMembers}
        lineupSize={lineupSize}
        highlight={isChanged('images')}
      />

  
      </div>

      {/* Videos */}
      <Videos
        videos={videos}
        setVideos={(val) => {
          setVideos(val);
          markChanged('videos');
        }}
        highlight={isChanged('videos')}
      />

      {/* TSC Videos */}
      {userRole?.includes("agent") && (
        <TscVideos
          tscVideos={tscVideos}
          setTscVideos={(val) => {
            setTscVideos(val);
            markChanged('tscVideos');
          }}
          highlight={isChanged('tscVideos')}
        />
      )}

      {/* MP3s */}
      <Mp3s
        mp3s={mp3s}
        setMp3s={(val) => {
          setMp3s(val);
          markChanged('mp3s');
        }}
        highlight={isChanged('mp3s')}
      />

      {/* Descriptions */}
      <div className="flex flex-row gap-4">
        <ActDescription
          description={description}
          setDescription={(val) => {
            setDescription(val);
            markChanged('description');
          }}
          className={isChanged('description') ? 'border-yellow-400 bg-yellow-50' : ''}
        />
         {userRole?.includes("agent") && (
          <TscActDescription
            tscDescription={tscDescription}
            setTscDescription={(val) => {
              setTscDescription(val);
              markChanged('tscDescription');
            }}
            className={isChanged('tscDescription') ? 'border-yellow-400 bg-yellow-50' : ''}
          />
        )}
      </div>

      {/* Bios */}
      <div className="flex flex-row gap-4">
        <ActBio
          bio={bio}
          setBio={(val) => {
            setBio(val);
            markChanged('bio');
          }}
          className={isChanged('bio') ? 'border-yellow-400 bg-yellow-50' : ''}
        />
  {userRole?.includes("agent") && (          <TscBio
            tscBio={tscBio}
            setTscBio={(val) => {
              setTscBio(val);
              markChanged('tscBio');
            }}
            className={isChanged('tscBio') ? 'border-yellow-400 bg-yellow-50' : ''}
          />
        )}
      </div>
    </div>
  );
};

export default StepOne;