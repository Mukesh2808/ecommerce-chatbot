#!/bin/bash

echo "🐳 Starting E-commerce Chatbot in Development Mode..."

# Stop any running containers
docker-compose down

# Build and start services
docker-compose up --build

echo "✅ Application started successfully!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔗 Backend: http://localhost:5000"
echo "🍃 MongoDB: http://localhost:27017"
echo "📊 Mongo Express: http://localhost:8081"
