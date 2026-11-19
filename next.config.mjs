/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const repoName = process.env.GITHUB_REPO_NAME || 'smart-health-assessment';
const basePath = isGithubPages ? `/${repoName}` : '';

const nextConfig = {
  transpilePackages: ['three'],
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  ...(isGithubPages
    ? {
        output: 'export',
        basePath,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
