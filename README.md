# Devs Society Portal

A complete member portal system for the Devs Society with React frontend and Node.js backend, featuring the same UI design and effects as the main Devs Technical Society website.

## Features

- 🔐 **Member Authentication** - Simple email-based login system
- 📝 **Member Registration** - Complete registration form with photo upload
- 🎫 **Digital Membership Cards** - QR code-enabled digital cards
- 📅 **Event Management** - View and register for society events
- 🎨 **Modern UI** - Dark theme with cyan accents, particle effects, and glitch animations
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **React Particles** for background effects
- **QR Code generation** for membership cards
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Multer** for file uploads
- **Express Validator** for input validation
- **Helmet** for security
- **CORS** for cross-origin requests

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   cd portal.devs-society
   ```

2. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend will be available at: http://localhost:5173

3. **Setup Backend**
   ```bash
   cd ../backend
   npm install
   
   # Create environment variables (copy from .env.example)
   # Set your MongoDB URI and JWT secret
   
   npm run dev
   ```
   Backend API will be available at: http://localhost:5000

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/devs-portal

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

## Usage

### For Members

1. **Registration**: Visit `/register` to create a new account
   - Fill in personal details (name, email, phone)
   - Select college and batch year
   - Choose member role
   - Upload profile photo (optional)

2. **Login**: Use `/login` with your registered email

3. **Dashboard**: After login, access your member portal with options to:
   - View your digital membership card
   - Check upcoming events
   - Manage your profile

4. **Digital Card**: Display your QR-enabled membership card for event check-ins

5. **Events**: View society events and register your attendance

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new member
- `POST /api/auth/login` - Login with email

#### Users
- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/profile` - Update profile (protected)
- `GET /api/users/members` - List all members (protected)

#### Events
- `GET /api/events` - Get all events (protected)
- `GET /api/events/upcoming` - Get upcoming events (protected)
- `POST /api/events` - Create event (admin)
- `POST /api/events/:id/register` - Register for event (protected)
- `DELETE /api/events/:id/unregister` - Unregister from event (protected)

## Project Structure

```
portal.devs-society/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/          # Base UI components (Button, Input, etc.)
│   │   │   ├── particles.tsx # Particle background effect
│   │   │   └── loading-screen.tsx
│   │   ├── pages/           # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── MemberCard.tsx
│   │   │   └── Events.tsx
│   │   ├── lib/
│   │   │   └── utils.ts     # Utility functions
│   │   └── App.tsx          # Main app component
│   └── public/              # Static assets
├── backend/                  # Node.js backend
│   ├── src/
│   │   ├── models/          # MongoDB schemas
│   │   │   ├── User.ts
│   │   │   └── Event.ts
│   │   ├── routes/          # API routes
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   └── events.ts
│   │   ├── middleware/      # Custom middleware
│   │   │   └── auth.ts
│   │   └── index.ts         # Server entry point
│   └── uploads/             # File upload directory
└── README.md
```

## Design Features

The portal inherits the beautiful design from the main Devs Technical Society website:

- **Dark Theme**: Black background with cyan (#0dcaf0) accents
- **Particle Effects**: Interactive particle background on all pages
- **Glitch Text**: Animated glitch effects on headings
- **Loading Animation**: Logo animation with glow effects
- **Gradient Cards**: Beautiful glass-morphism cards with gradients
- **Responsive Layout**: Mobile-first responsive design
- **Modern Typography**: Poppins and Orbitron fonts

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is part of the Devs Society ecosystem and follows the same licensing terms.

## Support

For support, please contact the Devs Society team or create an issue in the repository.

---

**Built with ❤️ by the Devs Society Team** 