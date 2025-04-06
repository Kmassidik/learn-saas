# Deploying TaskFlow

This guide will help you deploy the TaskFlow application to a production environment.

## Prerequisites

- Node.js version 18.x or higher
- A Supabase account
- Vercel account (recommended for deployment)

## Environment Variables

Ensure the following environment variables are set:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment Steps

### 1. Prepare Your Application for Production

Run the following commands:

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Test the production build locally
npm run start
```

### 2. Deploy to Vercel (Recommended)

1. Push your code to a GitHub, GitLab, or Bitbucket repository.

2. Visit [Vercel](https://vercel.com) and create a new account or log in.

3. Click "New Project" and import your repository.

4. Configure your environment variables:

   - Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project.

5. Click "Deploy" and wait for the deployment to complete.

6. Your application will be available at the provided Vercel URL.

### 3. Alternative Deployment Options

#### Deploy to Netlify

1. Create a `netlify.toml` file in your project root:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

2. Push to GitHub and connect to Netlify.

#### Deploy to a Custom Server

1. Build your application:

```bash
npm run build
```

2. Set up a Node.js server environment.

3. Transfer the following directories to your server:

   - `.next/`
   - `public/`
   - `node_modules/` (or run `npm install` on the server)
   - `package.json`

4. Set the environment variables on your server.

5. Start the application:

```bash
npm run start
```

## Post-Deployment Checks

After deploying, verify that:

1. User authentication is working properly
2. Real-time updates are functioning
3. All API routes are accessible
4. Database connections are secure

## Troubleshooting

### Authentication Issues

- Ensure your Supabase URL and anon key are correctly set in environment variables.
- Check that your Supabase authentication settings allow email signup/login.

### Database Issues

- Verify that the Supabase database has the correct schema and RLS policies.
- Ensure your database has enough resources for your expected traffic.

### Performance Issues

- Enable incremental static regeneration for applicable pages.
- Consider adding caching for frequently accessed data.
- Monitor your Supabase usage and upgrade if necessary.

## Maintenance

- Regularly update dependencies to keep the application secure.
- Monitor your Supabase database performance and scale as needed.
- Set up monitoring and error tracking with a service like Sentry.

## Scaling Considerations

- Supabase has usage limits on the free tier. Consider upgrading for production use.
- Implement proper caching strategies as user numbers grow.
- Consider serverless functions for computationally intensive operations.
