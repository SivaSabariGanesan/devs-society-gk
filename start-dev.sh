#!/bin/bash

# Devs Society Portal - Development Startup Script

echo "🚀 Starting Devs Society Portal Development Environment..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        return 0
    fi
}

# Check if ports are available
echo "🔍 Checking ports..."
if ! check_port 5173; then
    echo "Please stop the service running on port 5173 or change the frontend port"
    exit 1
fi

if ! check_port 5000; then
    echo "Please stop the service running on port 5000 or change the backend port"
    exit 1
fi

echo "✅ Ports 5173 and 5000 are available"
echo ""

# Start Backend
echo "🔧 Starting Backend (Node.js + Express)..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found in backend directory."
    echo "Please create a .env file with your configuration."
    echo "Example:"
    echo "PORT=5000"
    echo "MONGODB_URI=mongodb://localhost:27017/devs-portal"
    echo "JWT_SECRET=your_super_secret_jwt_key_here"
    echo "FRONTEND_URL=http://localhost:5173"
fi

# Build TypeScript if needed
npm run build

# Start backend in background
npm run dev &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"
echo "🌐 Backend API: http://localhost:5000"
echo ""

# Start Frontend
echo "⚛️  Starting Frontend (React + Vite)..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend in background
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"
echo "🌐 Frontend App: http://localhost:5173"
echo ""

echo "🎉 Devs Society Portal is now running!"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:5000"
echo "📊 Health Check: http://localhost:5000/api/health"
echo ""
echo "Press Ctrl+C to stop both services..."

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Wait for processes
wait $FRONTEND_PID $BACKEND_PID 