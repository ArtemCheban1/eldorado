# El Dorado - Archaeological Map Management System

A modern web application for managing archaeological sites, findings, and points of interest on interactive maps.

## 🗺️ Features

- **User Authentication**: Secure login with Google, Facebook, and GitHub OAuth
- **Interactive Map Interface**: Full-screen map with customizable layers
- **Multiple Map Providers**: Support for OpenStreetMap, Google Maps, Apple Maps, and historical overlays
- **Archaeological Site Management**:
  - Mark areas with customizable radiuses
  - Categorize sites (archaeological areas, findings, points of interest)
  - Store detailed descriptions and metadata
  - User-specific data isolation (your data is private)
- **Photo Management**: Upload and organize photos for each site
- **Data Import/Export**: Support for GeoJSON, KML, CSV, and GPX formats
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (React 18) + TypeScript
- **Authentication**: NextAuth.js with OAuth providers (Google, Facebook, GitHub)
- **Styling**: Tailwind CSS
- **Maps**: Leaflet + React-Leaflet
- **Database**: MongoDB Atlas
- **Hosting**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- MongoDB Atlas account (free tier available)
- (Optional) Google Maps API key for Google Maps integration

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd eldorado
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eldorado?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_SECRET=your_random_secret_here  # Generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers (at least one is required)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Optional: Add map API keys as needed
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

### 4. Configure OAuth Providers

You need to set up OAuth applications for at least one provider:

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 Client ID
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

#### Facebook OAuth
1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Create a new app
3. Add Facebook Login product
4. Add redirect URI: `http://localhost:3000/api/auth/callback/facebook`
5. Copy App ID and App Secret to `.env.local`

#### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Homepage URL: `http://localhost:3000`
4. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
5. Copy Client ID and generate Client Secret, add to `.env.local`

### 5. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
eldorado/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── api/                # API routes
│   │   │   ├── auth/          # NextAuth authentication
│   │   │   │   └── [...nextauth]/
│   │   │   └── sites/         # Sites CRUD endpoints
│   │   ├── layout.tsx         # Root layout with SessionProvider
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── MapView.tsx        # Main map component
│   │   ├── LeftSidebar.tsx    # Tools sidebar
│   │   ├── RightSidebar.tsx   # Details sidebar
│   │   ├── AuthButton.tsx     # Authentication button
│   │   └── SessionProvider.tsx # NextAuth session wrapper
│   ├── lib/                   # Utility libraries
│   │   ├── db.ts             # MongoDB connection
│   │   ├── mongodb-client.ts # MongoDB client for NextAuth
│   │   ├── auth.ts           # NextAuth configuration
│   │   └── auth-middleware.ts # API route protection
│   └── types/                # TypeScript type definitions
│       ├── index.ts          # Shared types (User, Site, etc.)
│       └── next-auth.d.ts    # NextAuth type extensions
├── public/                   # Static assets
├── .env.local.example       # Environment variables template
├── next.config.js           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
└── package.json             # Dependencies
```

## 🗄️ Database Setup

### MongoDB Atlas (Free Tier)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier: M0 Sandbox, 512MB storage)
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and add to `.env.local`

### Collections

The app uses these MongoDB collections:

- `users`: User accounts (created by NextAuth)
- `accounts`: OAuth provider accounts (created by NextAuth)
- `sessions`: User sessions (created by NextAuth)
- `sites`: Archaeological sites, findings, and points of interest
- `projects`: (Future) Multiple project management
- `photos`: (Future) Photo metadata and storage references

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Import project at [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

```bash
# Or use Vercel CLI
npm i -g vercel
vercel
```

### Deploy to Google Cloud

See [Google Cloud deployment guide](https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nodejs-service)

## 🎯 Roadmap

- [x] User authentication (Google, Facebook, GitHub OAuth)
- [x] User-specific data isolation
- [ ] Google Maps integration
- [ ] Apple Maps support
- [ ] Historical map overlays
- [ ] Advanced filtering and search
- [ ] Photo upload and gallery
- [ ] Data import (GeoJSON, KML, CSV, GPX)
- [ ] Export functionality
- [ ] Multi-project support
- [ ] Collaborative editing
- [ ] Mobile app (React Native)

## 💰 Cost Estimate (Monthly)

**Development/Small Scale:**
- Vercel: $0 (free tier)
- MongoDB Atlas: $0 (free tier, 512MB)
- **Total: $0/month**

**Production/Scale:**
- Vercel Pro: $20/month
- MongoDB Atlas M10: $9-15/month
- Google Maps API: Pay-as-you-go (free $200 credit/month)
- **Total: ~$30-50/month**

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
