#!/bin/bash

# NexFinance Local Start Script
# Starts backend on 8099 and frontend on 3033

set -e

PROJECT_DIR="/tmp/al-musabbihin-nexfinance"
BACKEND_PORT=8099
FRONTEND_PORT=3033

echo "🚀 NexFinance Local Development Setup"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION"

# Setup backend
echo ""
echo -e "${BLUE}Setting up Backend (Port $BACKEND_PORT)...${NC}"
cd "$PROJECT_DIR/backend"

if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install > /dev/null 2>&1
fi

echo "✅ Backend ready"

# Setup frontend
echo ""
echo -e "${BLUE}Setting up Frontend (Port $FRONTEND_PORT)...${NC}"
cd "$PROJECT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install --legacy-peer-deps > /dev/null 2>&1
fi

echo "✅ Frontend ready"

# Start services
echo ""
echo -e "${GREEN}Starting services...${NC}"
echo ""

cd "$PROJECT_DIR/backend"
echo -e "${YELLOW}Backend starting on port $BACKEND_PORT...${NC}"
PORT=$BACKEND_PORT npm start &
BACKEND_PID=$!

sleep 3

cd "$PROJECT_DIR/frontend"
echo -e "${YELLOW}Frontend starting on port $FRONTEND_PORT...${NC}"
PORT=$FRONTEND_PORT npm start &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}✅ Services Started!${NC}"
echo ""
echo "Backend:  http://localhost:$BACKEND_PORT"
echo "Frontend: http://localhost:$FRONTEND_PORT"
echo ""
echo "Demo Credentials:"
echo "  Email:    admin@nexfinance.com"
echo "  Password: admin123"
echo ""
echo "Press Ctrl+C to stop services"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
