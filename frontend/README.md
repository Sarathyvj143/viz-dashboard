# Visualization Platform - Frontend

A modern, responsive web application for creating and managing data visualizations and dashboards.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Zustand** - State management
- **Recharts** - Charting library
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **html2canvas** - Export functionality
- **React Grid Layout** - Dashboard layouts

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create environment file (optional):

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8000/api
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

Build the application:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

### Testing

Run tests:

```bash
npm test
```

### Linting

Run ESLint:

```bash
npm run lint
```

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Root component with routing
│   ├── index.css             # Global styles with Tailwind
│   ├── components/           # Reusable components
│   │   ├── common/          # Common UI components
│   │   ├── charts/          # Chart-related components
│   │   ├── dashboard/       # Dashboard components
│   │   └── admin/           # Admin panel components
│   ├── pages/               # Page components
│   ├── store/               # Zustand state stores
│   ├── api/                 # API client and endpoints
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── public/                  # Static assets
├── Dockerfile              # Docker configuration
└── vite.config.ts          # Vite configuration
```

## Features

- User authentication and authorization
- Interactive chart creation with multiple chart types
- Dashboard builder with drag-and-drop layout
- Real-time data visualization
- Public dashboard sharing
- Export to PDF/PNG
- Responsive design
- Dark mode support (planned)

## API Integration

The frontend connects to the backend API at `http://localhost:8000/api` by default. This can be configured in the `.env` file or through the Vite proxy configuration.

All API calls are authenticated using JWT tokens stored in localStorage.

## Docker Deployment

Build the Docker image:

```bash
docker build -t visualization-platform-frontend .
```

Run the container:

```bash
docker run -p 80:80 visualization-platform-frontend
```

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: `/api`)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT
