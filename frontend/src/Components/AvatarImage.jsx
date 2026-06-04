const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle fill='%23e2e8f0' cx='32' cy='32' r='32'/%3E%3Ccircle fill='%23ffffff' cx='32' cy='24' r='14'/%3E%3Cpath fill='%23ffffff' d='M16 52c0-8.8 7.2-16 16-16s16 7.2 16 16'/%3E%3C/svg%3E";

const BLOCKED_AVATAR_HOSTS = ["avatar.iran.liara.run", "iran.liara.run"];

const shouldUseFallback = (src) => {
  if (!src) return true;
  const normalizedSrc = String(src).trim().toLowerCase();
  if (BLOCKED_AVATAR_HOSTS.some((host) => normalizedSrc.includes(host))) {
    return true;
  }

  try {
    const url = new URL(normalizedSrc, window.location.origin);
    return BLOCKED_AVATAR_HOSTS.some((host) => url.hostname.includes(host));
  } catch (error) {
    return true;
  }
};

const AvatarImage = ({ src, alt, className = "", ...props }) => {
  const effectiveSrc = shouldUseFallback(src) ? DEFAULT_AVATAR : src;

  const handleError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = DEFAULT_AVATAR;
  };

  return (
    <img
      src={effectiveSrc}
      alt={alt || "avatar"}
      className={className}
      onError={handleError}
      {...props}
    />
  );
};

export default AvatarImage;
