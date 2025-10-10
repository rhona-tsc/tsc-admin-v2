const Discount = ({
  discountToClient,
  setDiscountToClient,
  isPercentage,
  setIsPercentage
}) => {
  return (
    <div className="border rounded-md max-h-[750px] overflow-y-auto bg-white mb-20">
      <div className="sticky top-0 bg-white z-10 p-4 shadow-sm ">
        <h2 className="text-xl font-semibold mb-2">Encouraging Bookings</h2>
      </div>

      <div className="p-4">
        <p className="mb-4">
          Would you like to send a discount to potential clients to encourage them to book after 5
          days of shortlisting? If so, please provide the <span className="font-semibold">value of the discount</span> you'd like to offer:
        </p>

        {/* Toggle */}
        <div className="flex items-center gap-4 mb-4">
         
          <div
            className={`toggle ${isPercentage ? "on" : "off"}`}
            onClick={() => setIsPercentage((prev) => !prev)}
            style={{
              cursor: "pointer",
              width: "50px",
              height: "30px",
              borderRadius: "15px",
              backgroundColor: isPercentage ? "#ff6667" : "#ccc",
              position: "relative"
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "5px",
                left: isPercentage ? "25px" : "5px",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                backgroundColor: "white",
                transition: "left 0.2s"
              }}
            ></div>
          </div>
          <span className="text-sm">{isPercentage ? "Percentage (%)" : "Flat Rate (£)"}</span>
        </div>

        {/* Input */}
        <div className="flex justify-left mb-2">
          <div className="flex items-center gap-2 w-1/2">
            <span className="text-lg font-semibold">{isPercentage ? "%" : "£"}</span>
            <input
              type="number"
              value={discountToClient}
              onChange={(e) => setDiscountToClient(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded"
              placeholder={isPercentage ? "5" : "100"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discount;