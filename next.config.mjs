/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const repoName = process.env.GITHUB_REPO_NAME || 'smart-health-assessment';

const nextConfig = {
  transpilePackages: ['three'],
  reactStrictMode: true,
  ...(isGithubPages
    ? {
        output: 'export',
        basePath: `/${repoName}`,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
