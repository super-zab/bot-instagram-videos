/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from external CDNs used by the pipeline services
  images: {
    remotePatterns: [
      // Pollinations.ai — free image generation (image format)
      { protocol: "https", hostname: "image.pollinations.ai" },
      // Fal.ai CDN — generated video thumbnails (video format)
      { protocol: "https", hostname: "storage.googleapis.com" },
      // Generic example storage — replace with your actual bucket hostname
      { protocol: "https", hostname: "storage.example.com" },
    ],
  },
};

module.exports = nextConfig;
