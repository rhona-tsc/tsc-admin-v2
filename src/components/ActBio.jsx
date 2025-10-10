import React from 'react'

const ActBio = ({ bio, setBio }) => {
  
  return (
    <div className="w-full">
    <p className="mb-2">
      <strong>Act Bio</strong>
    </p>
    <textarea
      onChange={(e) => setBio(e.target.value)}
      value={bio}
      className="w-full px-3 py-2"
      placeholder="Bio"
    />
  </div>
  )
}

export default ActBio
