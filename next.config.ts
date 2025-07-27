import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	transpilePackages: ["@product-studio/agents"],
	output: 'standalone',
	experimental: {
		outputFileTracingIncludes: {
			'/api/**/*': ['./src/mastra/**/*'],
		},
	},
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{
						key: 'X-Frame-Options',
						value: 'DENY',
					},
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff',
					},
					{
						key: 'X-XSS-Protection',
						value: '1; mode=block',
					},
					{
						key: 'Referrer-Policy',
						value: 'strict-origin-when-cross-origin',
					},
					{
						key: 'Permissions-Policy',
						value: 'camera=(), microphone=(), geolocation=()',
					},
					{
						key: 'Strict-Transport-Security',
						value: 'max-age=31536000; includeSubDomains',
					},
				],
			},
		];
	},
}

export default nextConfig
