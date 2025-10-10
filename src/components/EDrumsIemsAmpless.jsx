import React, { useEffect } from 'react';

const EDrumsIemsAmpless = ({ lineups = [], setLineups, index = 0 }) => {
  if (!Array.isArray(lineups)) return null;

  const lineup = lineups[index] || {};

  const {
    eDrums = false,
    ampless = false,
    iems = false,
    withoutDrums = false,
    acoustic = false,
    anotherVocalist = false,
    hasDrums = false,
  } = lineup;

  const updateLineupField = (field, value) => {
    setLineups((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  useEffect(() => {
    if (!hasDrums && withoutDrums) {
      updateLineupField("withoutDrums", false);
    }
    if (!hasDrums && eDrums) {
      updateLineupField("eDrums", false);
    }
  }, [hasDrums, eDrums, withoutDrums]);

  return (
    <div className="mt-3 space-y-5">
      {/* IEMs */}
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-4">
          <label className="text-left">
            Can this lineup perform with in-ear-monitors (IEMs) only (i.e. no floor monitors)?
          </label>
        </div>
        <div className="col-span-1 flex items-center gap-3 justify-end">
          <div
            className={`toggle ${iems ? "on" : "off"}`}
            onClick={() => updateLineupField("iems", !iems)}
            style={{
              cursor: "pointer",
              width: "60px",
              height: "30px",
              borderRadius: "15px",
              backgroundColor: iems ? "#ff6667" : "#ccc",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "5px",
                left: iems ? "30px" : "5px",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                backgroundColor: "white",
                transition: "left 0.2s",
              }}
            ></div>
          </div>
          <p className="whitespace-nowrap">{iems ? "Yes" : "No"}</p>
        </div>
    
           {/* Has Drums */}
     
        <div className="col-span-3">
          <label className="text-left">
            Does this lineup usually have drums in it?
          </label>
        </div>
        <div className="col-span-1 flex items-center gap-3 justify-end">
          <div
            className={`toggle ${hasDrums ? "on" : "off"}`}
            onClick={() => updateLineupField("hasDrums", !hasDrums)}
            style={{
              cursor: "pointer",
              width: "60px",
              height: "30px",
              borderRadius: "15px",
              backgroundColor: hasDrums ? "#ff6667" : "#ccc",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "5px",
                left: hasDrums ? "30px" : "5px",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                backgroundColor: "white",
                transition: "left 0.2s",
              }}
            ></div>
          </div>
          <p className="whitespace-nowrap">{hasDrums ? "Yes" : "No"}</p>


        </div>
      </div>


    
      {/* Acoustic */}
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-4">
          <label className="text-left">
            Can this lineup perform entirely acoustic?
          </label>
        </div>
        <div className="col-span-1 flex items-center gap-3 justify-end">
          <div
            className={`toggle ${acoustic ? "on" : "off"}`}
            onClick={() => updateLineupField("acoustic", !acoustic)}
            style={{
              cursor: "pointer",
              width: "60px",
              height: "30px",
              borderRadius: "15px",
              backgroundColor: acoustic ? "#ff6667" : "#ccc",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "5px",
                left: acoustic ? "30px" : "5px",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                backgroundColor: "white",
                transition: "left 0.2s",
              }}
            ></div>
          </div>
          <p className="whitespace-nowrap">{acoustic ? "Yes" : "No"}</p>
        </div>
     

        {/* Conditionally show only if hasDrums is true */}
        {hasDrums && (
        <>
          {/* Without Drums */}
         
            <div className="col-span-3">
              <label className="text-left">
                Can this lineup perform without drums?
              </label>
            </div>
            <div className="col-span-1 flex items-center gap-3 justify-end">
              <div
                className={`toggle ${withoutDrums ? "on" : "off"}`}
                onClick={() => updateLineupField("withoutDrums", !withoutDrums)}
                style={{
                  cursor: "pointer",
                  width: "60px",
                  height: "30px",
                  borderRadius: "15px",
                  backgroundColor: withoutDrums ? "#ff6667" : "#ccc",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "5px",
                    left: withoutDrums ? "30px" : "5px",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: "white",
                    transition: "left 0.2s",
                  }}
                ></div>
              </div>
              <p className="whitespace-nowrap">{withoutDrums ? "Yes" : "No"}</p>
            </div>

        </>
      )}
   </div>
  
      {/* Ampless */}
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-4">
          <label className="text-left">
            Can this lineup perform ampless (i.e. direct input only)?
          </label>
        </div>
        <div className="col-span-1 flex items-center gap-3 justify-end">
          <div
            className={`toggle ${ampless ? "on" : "off"}`}
            onClick={() => updateLineupField("ampless", !ampless)}
            style={{
              cursor: "pointer",
              width: "60px",
              height: "30px",
              borderRadius: "15px",
              backgroundColor: ampless ? "#ff6667" : "#ccc",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "5px",
                left: ampless ? "30px" : "5px",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                backgroundColor: "white",
                transition: "left 0.2s",
              }}
            ></div>
          </div>
          <p className="whitespace-nowrap">{ampless ? "Yes" : "No"}</p>
        </div>
  

        {/* Conditionally show only if hasDrums is true */}
        {hasDrums && (
        <>
  
          {/* Electric Drums */}
            <div className="col-span-3">
              <label className="text-left">
                Can this lineup perform with electric drums?
              </label>
            </div>
            <div className="col-span-1 flex items-center gap-3 justify-end">
              <div
                className={`toggle ${eDrums ? "on" : "off"}`}
                onClick={() => updateLineupField("eDrums", !eDrums)}
                style={{
                  cursor: "pointer",
                  width: "60px",
                  height: "30px",
                  borderRadius: "15px",
                  backgroundColor: eDrums ? "#ff6667" : "#ccc",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "5px",
                    left: eDrums ? "30px" : "5px",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: "white",
                    transition: "left 0.2s",
                  }}
                ></div>
              </div>
              <p className="whitespace-nowrap">{eDrums ? "Yes" : "No"}</p>
            </div>

        </>
      )}
      </div>
  
      {/* Another Vocalist */}
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-4">
          <label className="text-left">
            Can the client add a vocalist (or another vocalist) to your act?
          </label>
        </div>
        <div className="col-span-1 flex items-center gap-3 justify-end">
          <div
            className={`toggle ${anotherVocalist ? "on" : "off"}`}
            onClick={() => updateLineupField("anotherVocalist", !anotherVocalist)}
            style={{
              cursor: "pointer",
              width: "60px",
              height: "30px",
              borderRadius: "15px",
              backgroundColor: anotherVocalist ? "#ff6667" : "#ccc",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "5px",
                left: anotherVocalist ? "30px" : "5px",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                backgroundColor: "white",
                transition: "left 0.2s",
              }}
            ></div>
          </div>
          <p className="whitespace-nowrap">{anotherVocalist ? "Yes" : "No"}</p>
        </div>
      </div>
  
     
  
    </div>
  );
};

export default EDrumsIemsAmpless;