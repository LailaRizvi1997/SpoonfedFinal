// @ts-check

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

export default config;