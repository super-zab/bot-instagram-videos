/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from external video/thumbnail CDNs
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "storage.lumalabs.ai" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
};

module.exports = nextConfig;
