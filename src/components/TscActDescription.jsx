import React from 'react'

const TscActDescription = ({ tscDescription, setTscDescription }) => {
    
  return (
    <div className="w-1/2">
    <p className="mb-2">
      <strong>TSC Description </strong>
      <span className="text-sm text-gray-500">({(tscDescription || '').length}/160)</span>    </p>
    <textarea
      onChange={(e) => setTscDescription(e.target.value)}
      value={tscDescription}
      className="w-full px-3 py-2"
      placeholder="A short and snappy description of your act"
      maxLength={160}
    />
  </div>
  )
}

export default TscActDescription
