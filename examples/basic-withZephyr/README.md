# Modern.js + Zephyr Example

This example demonstrates how to integrate Modern.js with Zephyr, showcasing a basic setup for building and deploying applications. Zephyr Cloud is a framework agnostic deployment platform, allowing users to deploy to their own cloud.

<span align="center"><a href="#supported-cloud-provider">Supported Cloud Providers</a></span> | <span align="center"><a href="https://docs.zephyr-cloud.io/recipes">Supported Frameworks</a></span>

## Getting Started

### Deployment

Before deploying:

1. Initialize a new git repository.

   ```bash
   git init
   ```

2. Add remote origin.

   ```bash
   git remote add origin <repository-url>
   ```

3. Commit your changes.

   ```bash
   git add .
   git commit -m "Initial commit"
   ```

4. Install dependencies:

   ```bash
   pnpm install
   ```

5. Build for production:

   ```bash
   pnpm build
   ```

The deployment URL will be shown in the console output after successful build.

## Configuration

This example includes a preconfigured `modern.config.ts` with Zephyr integration. Key configuration includes:

- Flat HTML output structure
- Main entry configuration
- Zephyr plugin setup
- RSPack/Webpack bundler configuration

Read more about it here https://docs.zephyr-cloud.io/recipes/modernjs

## Troubleshooting network connection

If you are using Zephyr in China you might encounter network connection issue. While Zephyr Cloud is still preparing for launching in China, please refer to appropriate internet usage if you plan to deploy with Zephyr.

## Supported Cloud Provider

- [Cloudflare](https://docs.zephyr-cloud.io/cloud/cloudflare)
- [Fastly](https://docs.zephyr-cloud.io/cloud/fastly)
- [Netlify](https://docs.zephyr-cloud.io/cloud/netlify)

Please [refer to Zephyr Cloud's documentation](https://docs.zephyr-cloud.io/cloud) for the latest cloud provider integrations and configuration guide.

## Learn More about Zephyr Cloud

- [Website](https://zephyr-cloud.io/)
- [Documentation](https://docs.zephyr-cloud.io/)
- [Discord](https://zephyr-cloud.io/discord)
- [Twitter](https://zephyr-cloud.io/twitter)
- [Youtube](https://zephyr-cloud.io/youtube)
