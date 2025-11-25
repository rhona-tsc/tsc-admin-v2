import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import CustomToast from "./CustomToast";
import { backendUrl } from "../App";
import { useNavigate } from "react-router-dom";

const GatekeeperModal = ({
  isOpen,
  onClose,
  userFirstName = "",
  userEmail = "",
  userId = "",
}) => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    actName: "",
    videoLinks: [""],
    extraInfo: "",
    isBandLeader: true,
    managerName: "",
    managerEmail: "",
    hasCode: false,
    inviteCode: "",
  });

  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const update = (patch) => setForm((p) => ({ ...p, ...patch }));

  const updateVideoLink = (i, value) => {
    const next = [...form.videoLinks];
    next[i] = value;
    update({ videoLinks: next });
  };

  const addVideoLink = () => update({ videoLinks: [...form.videoLinks, ""] });

  const removeVideoLink = (i) => {
    const next = form.videoLinks.filter((_, idx) => idx !== i);
    update({ videoLinks: next.length ? next : [""] });
  };

  const handleSubmit = async () => {
    const trimmedLinks = form.videoLinks.map((v) => v.trim()).filter(Boolean);

    if (!form.actName.trim()) {
      toast(<CustomToast type="error" message="Please add your act name." />);
      return;
    }

    if (trimmedLinks.length === 0) {
      toast(
        <CustomToast type="error" message="Please add at least one video link." />
      );
      return;
    }

    if (!form.isBandLeader) {
      if (!form.managerName.trim() || !form.managerEmail.trim()) {
        toast(
          <CustomToast
            type="error"
            message="Please provide band leader/manager name and email."
          />
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      // ✅ If they have a code, verify and route them to Add Act
      if (form.hasCode && form.inviteCode.trim()) {
        const verifyRes = await axios.post(
          `${backendUrl}/api/act-invites/validate-code`,
          {
            code: form.inviteCode.trim().toUpperCase(),
            userId,
            actName: form.actName.trim(),
          }
        );

        if (verifyRes.data?.success) {
          // store code so AddAct2 can read it
          localStorage.setItem("actInviteCode", form.inviteCode.trim().toUpperCase());

          toast(
            <CustomToast
              type="success"
              message="Code accepted — unlocking submission form."
            />
          );

          onClose();
          navigate("/add-act-2", {
            state: { actInviteCode: form.inviteCode.trim().toUpperCase() },
          });
          return;
        }

        toast(
          <CustomToast
            type="error"
            message={verifyRes.data?.message || "Invalid or used code."}
          />
        );
        return;
      }

      // ✅ Otherwise, create PRE-submission
      const payload = {
        actName: form.actName.trim(),
        videoLinks: trimmedLinks,
        extraInfo: form.extraInfo.trim(),
        submittedBy: {
          userId,
          name: userFirstName,
          email: userEmail,
        },
        bandLeaderOrManager: form.isBandLeader
          ? {
              name: userFirstName,
              email: userEmail,
            }
          : {
              name: form.managerName.trim(),
              email: form.managerEmail.trim(),
            },
      };

      const res = await axios.post(
        `${backendUrl}/api/act-pre-submissions/submit`,
        payload
      );

      if (res.data?.success) {
        toast(
          <CustomToast
            type="success"
            message="Thanks! We’ll review your videos and be in touch if it’s a fit."
          />
        );
        onClose();
      } else {
        toast(
          <CustomToast
            type="error"
            message={res.data?.message || "Could not submit pre-submission."}
          />
        );
      }
    } catch (err) {
      console.error(err);
      toast(
        <CustomToast
          type="error"
          message="Something went wrong submitting your act."
        />
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4">
<div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">        {/* header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold">Submit Your Act</h3>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-700">
            Submit your act’s video links and we’ll be in touch if we feel it's a good fit for TSC.
          </p>

          {/* Act name */}
          <div>
            <label className="block text-sm font-medium mb-1">Act name</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.actName}
              onChange={(e) => update({ actName: e.target.value })}
              placeholder="e.g. Velvet Diamond"
            />
          </div>

          {/* Video links */}
          <div>
            <label className="block text-sm font-medium mb-2">Video links</label>
            <div className="space-y-2">
              {form.videoLinks.map((link, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="flex-1 border rounded px-3 py-2"
                    value={link}
                    onChange={(e) => updateVideoLink(i, e.target.value)}
                    placeholder="https://youtube.com/..."
                  />
                  {form.videoLinks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVideoLink(i)}
                      className="px-3 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addVideoLink}
              className="mt-2 text-sm px-3 py-2 bg-black text-white rounded hover:bg-[#ff6667]"
            >
              + Add another link
            </button>
          </div>

          {/* Optional info */}
          <div>
            <label className="block text-sm font-medium mb-1">
              If you need to provide any specific information you can do that here (optional)
            </label>
            <textarea
              className="w-full border rounded px-3 py-2 min-h-[90px]"
              value={form.extraInfo}
              onChange={(e) => update({ extraInfo: e.target.value })}
              placeholder="Anything you'd like us to know..."
            />
          </div>

          {/* Band leader toggle */}
          <div className="border rounded p-3 bg-gray-50 space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.isBandLeader}
                onChange={(e) => update({ isBandLeader: e.target.checked })}
              />
              I am the band leader / manager
            </label>

            {!form.isBandLeader && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Band leader / manager name
                  </label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={form.managerName}
                    onChange={(e) => update({ managerName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Band leader / manager email
                  </label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={form.managerEmail}
                    onChange={(e) => update({ managerEmail: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Invite code toggle */}
          <div className="border rounded p-3 space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.hasCode}
                onChange={(e) => update({ hasCode: e.target.checked })}
              />
              I have an act submission invite code
            </label>

            {form.hasCode && (
              <input
                className="w-full border rounded px-3 py-2"
                value={form.inviteCode}
                onChange={(e) => update({ inviteCode: e.target.value })}
                placeholder="XXXX-XXXX"
              />
            )}
          </div>
        </div>

        {/* footer */}
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-black text-white hover:bg-[#ff6667]"
            disabled={submitting}
          >
            {submitting
              ? "Submitting..."
              : form.hasCode
              ? "Unlock Add Act"
              : "Submit videos"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GatekeeperModal;