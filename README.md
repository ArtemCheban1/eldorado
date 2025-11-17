# El Dorado - Archaeological Map Management System

A modern web application for managing archaeological sites, findings, and points of interest on interactive maps.

## 🗺️ Features

- **Interactive Map Interface**: Full-screen map with customizable layers
- **Multiple Map Providers**: Support for OpenStreetMap, Google Maps, Apple Maps, and historical overlays
- **Archaeological Site Management**:
  - Mark areas with customizable radiuses
  - Categorize sites (archaeological areas, findings, points of interest)
  - Store detailed descriptions and metadata
- **Photo Management**: Upload and organize photos for each site
- **Data Import/Export**: Support for GeoJSON, KML, CSV, and GPX formats
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (React 18) + TypeScript
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
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eldorado?retryWrites=true&w=majority

# Optional: Add map API keys as needed
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

### 4. Run the development server

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
│   ├── app/                  # Next.js App Router
│   │   ├── api/             # API routes
│   │   │   └── sites/       # Sites CRUD endpoints
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   └── globals.css      # Global styles
│   ├── components/          # React components
│   │   ├── MapView.tsx      # Main map component
│   │   ├── LeftSidebar.tsx  # Tools sidebar
│   │   └── RightSidebar.tsx # Details sidebar
│   ├── lib/                 # Utility libraries
│   │   └── db.ts           # MongoDB connection
│   └── types/              # TypeScript type definitions
│       └── index.ts        # Shared types
├── public/                 # Static assets
├── .env.local.example     # Environment variables template
├── next.config.js         # Next.js configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── package.json           # Dependencies
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

- [ ] Google Maps integration
- [ ] Apple Maps support
- [ ] Historical map overlays
- [ ] Advanced filtering and search
- [ ] Photo upload and gallery
- [ ] Data import (GeoJSON, KML, CSV, GPX)
- [ ] Export functionality
- [ ] Multi-project support
- [ ] User authentication
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
