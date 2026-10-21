const normalise = (value) => String(value || "").trim().toLowerCase();

const ORIGINALS_PREVIEW_USER_IDS = new Set(["693ac400ef2c3100595c0ed8"]);
const ORIGINALS_PREVIEW_EMAILS = new Set([
  "hello@thesupremecollective.co.uk",
  "rhona@thesupremecollective.co.uk",
  "ewanneilmcintosh@gmail.com",
]);

export const canAccessOriginalsPreview = ({ userId, email } = {}) => {
  const normalisedUserId = String(userId || "").trim();
  const normalisedEmail = normalise(email);

  return (
    ORIGINALS_PREVIEW_USER_IDS.has(normalisedUserId) ||
    ORIGINALS_PREVIEW_EMAILS.has(normalisedEmail) ||
    /^tsc[^@]*@gmail\.com$/i.test(normalisedEmail)
  );
};
