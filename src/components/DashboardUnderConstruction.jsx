const DashboardUnderConstruction = () => {
  return (
    <div className="bg-black text-white p-6 mt-8 rounded-md shadow-lg border border-gray-800">
      <div className="flex flex-col items-center gap-4">

        {/* Equalizer Animation */}
        <div className="flex gap-1 h-12 items-end">
          <div className="eq-bar bar1"></div>
          <div className="eq-bar bar2"></div>
          <div className="eq-bar bar3"></div>
          <div className="eq-bar bar4"></div>
          <div className="eq-bar bar5"></div>
        </div>

        {/* Message Box */}
          <h2 className="text-xl font-bold tracking-wide mb-3 text-center">
        Dashboard Under Construction
          </h2>

          <p className="text-sm leading-relaxed opacity-90 text-center">
            <strong>Thanks for joining us for setup!</strong>
            <br />
            As you'll see, we're not quite 100% ready to go live yet — the team is still
            plugging in the cables, tuning the guitars, and running a quick soundcheck.
            <br /><br />
            Your dashboard will be live shortly — <strong>stay tuned</strong>!
            <br /><br />
            In the meantime, you're here because you've been invited to
            <strong> sign up to The Books</strong> — you’ll find that button in the menu
            on the left.
          </p>
        </div>

      </div>
  
  );
};

export default DashboardUnderConstruction;