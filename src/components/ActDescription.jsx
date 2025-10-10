import React from 'react'

const ActDescription = ({ description, setDescription }) => {
    
  return (
    <div className="w-1/2">
    <p className="mb-2">
      <strong>Act Description </strong>
      <span className="text-sm text-gray-500">({description.length}/160)</span>
    </p>
    <textarea
      onChange={(e) => setDescription(e.target.value)}
      value={description}
      className="w-full px-3 py-2"
      placeholder="A short and snappy description of your act"
      maxLength={160}
    />
  </div>
  )
}

export default ActDescription
