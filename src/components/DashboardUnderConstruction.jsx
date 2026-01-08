const DashboardUnderConstruction = ({ firstname }) => {
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
        <div className="w-full max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-wide mb-2">
            The Supreme Collective Portal
          </h2>

          <p className="text-sm opacity-90 mb-4">
            <strong>Hi {firstname}! Thanks for joining.</strong> We’ve got some genuinely exciting things
            planned for the future — built on <strong>10+ years</strong> of managing acts,
            booking gigs, and performing at a high level. Our goal is simple:{" "}
            <strong>more gigs</strong>, <strong>more musicians</strong>, and{" "}
            <strong>smoother processes</strong> for everyone.
          </p>

          <div className="text-sm leading-relaxed opacity-90 text-left space-y-4">
            <div>
              <h3 className="font-semibold text-white mb-1">What you can do here</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-200">
                <li>
                  <strong>Join The Books</strong> — think of this like your CV.
                  Add your skills, equipment, talents, and logistics so we can put you
                  forward to <strong>deputise</strong> in acts that suit you.
                </li>
                <li>
                  Once submitted, you’ll show up as a <strong>possible deputy</strong> for
                  acts registered on The Supreme Collective. Band leaders/managers can
                  browse and click through to your profile when they need your skill set.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-1">Submit An Act</h3>
              <p className="text-gray-200">
                We’re a little more selective with <strong>Submit Act</strong>. When you
                click it, there’s a quick <strong>pre-screen</strong> (act name, video
                links, and anything you want to highlight). If it’s a great fit, we’ll
                send you an <strong>Act Submission Invite Code</strong> to unlock the full
                act submission form. It’s detailed on purpose — it helps us be crystal
                clear with clients and lets you tailor exactly what you offer (set
                lengths, add-ons, rider requests, and more).
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-1">How The Admin System Works</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-200">
                <li>
                  Your acts will appear in <strong>Your Acts</strong>. Booked gigs will
                  appear in <strong>Bookings</strong>.
                </li>
                <li>
                  We’ll also track enquiries for your acts via the <strong>Enquiry Board</strong>.
                  An act being <strong>shortlisted</strong> or <strong>added to cart</strong>{" "}
                  counts as an enquiry.
                </li>
                <li>
                  Lead vocalists are asked for <strong>availability instantly</strong> when
                  an enquiry comes in, and it’s their responsibility to respond promptly.
                </li>
                 
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-1">What’s coming next</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-200">
                 <li>
                  Upon booking the system will eventually automatically allocate the original band members' if available and if not the sytem will automatically allocate your named deputies. Currently we'll do this manually until we're confident everything's running smoothly.
                </li>
                <li>
                  <strong>Payment Tracker</strong> to track payouts due to you (and your act team). For the moment please rely on the WhatsApp messages to confirm gig fees and make your own notes, as per usual.
                </li>
                <li>
                  A <strong>monthly performance overview</strong> with bookings, revenue, and
                  enquiries per act.
                </li>
                <li>
                  <strong>Peer reviews</strong> after gigs (technical skill, team spirit,
                  prep, punctuality, stage presence) and <strong>client satisfaction</strong>{" "}
                  averages — all visible on musician profiles in due course.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-1">Notice Board & Feedback</h3>
              <p className="text-gray-200">
                Any announcements from The Supreme Collective will appear in the <strong>Notice Board</strong>.
                And please use <strong>Feedback</strong> for anything that could improve the
                site or the overall experience — tech issues, workflow ideas, or constructive
                notes from gigs. We’re building this to be smooth, useful, and fair.
              </p>
            </div>

            <p className="text-center text-gray-200 pt-2">
              <strong>Minimalist for now</strong> — but built to scale. Thanks for being here.
              <br />
              <span className="font-semibold">Let’s go.</span>
            </p>

            <p className="text-center text-gray-300 pt-1">
              In the meantime, you’re here because you’ve been invited to{" "}
              <strong>Join The Books</strong> — you’ll find that button in the menu on
              the left.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardUnderConstruction;