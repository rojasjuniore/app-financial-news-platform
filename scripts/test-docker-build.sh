#!/bin/bash

# Test Docker Build Script for Financial News App
# This script tests both development and production Docker builds

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Financial News App - Docker Build Test${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}Error: Docker is not running${NC}"
        echo -e "${YELLOW}Please start Docker Desktop and try again${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker is running${NC}"
}

# Function to build and test production image
test_production() {
    echo ""
    echo -e "${BLUE}Building Production Image...${NC}"
    echo -e "${YELLOW}Using multi-stage build with Nginx${NC}"
    
    # Build production image
    docker build -t financial-news-app:production -f Dockerfile .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Production image built successfully${NC}"
        
        # Show image size
        echo ""
        echo -e "${BLUE}Production Image Info:${NC}"
        docker images financial-news-app:production --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
        
        # Test run
        echo ""
        echo -e "${BLUE}Testing production container...${NC}"
        docker run -d --name test-prod -p 8080:80 financial-news-app:production
        
        sleep 3
        
        # Check if container is running
        if docker ps | grep -q test-prod; then
            echo -e "${GREEN}✓ Production container is running${NC}"
            echo -e "${YELLOW}App available at: http://localhost:8080${NC}"
            
            # Clean up
            echo ""
            read -p "Press Enter to stop and remove test container..."
            docker stop test-prod
            docker rm test-prod
        else
            echo -e "${RED}✗ Production container failed to start${NC}"
            docker logs test-prod
            docker rm test-prod
        fi
    else
        echo -e "${RED}✗ Production image build failed${NC}"
    fi
}

# Function to build and test development image
test_development() {
    echo ""
    echo -e "${BLUE}Building Development Image...${NC}"
    echo -e "${YELLOW}Using hot-reload configuration${NC}"
    
    # Build development image
    docker build -t financial-news-app:development -f Dockerfile.dev .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Development image built successfully${NC}"
        
        # Show image size
        echo ""
        echo -e "${BLUE}Development Image Info:${NC}"
        docker images financial-news-app:development --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
        
        # Test run with volume mount
        echo ""
        echo -e "${BLUE}Testing development container...${NC}"
        docker run -d --name test-dev \
            -p 3001:3001 \
            -v $(pwd)/src:/app/src:delegated \
            -v $(pwd)/public:/app/public:delegated \
            -e CHOKIDAR_USEPOLLING=true \
            financial-news-app:development
        
        sleep 5
        
        # Check if container is running
        if docker ps | grep -q test-dev; then
            echo -e "${GREEN}✓ Development container is running${NC}"
            echo -e "${YELLOW}App available at: http://localhost:3001${NC}"
            echo -e "${YELLOW}Hot-reload enabled for /src and /public${NC}"
            
            # Show logs
            echo ""
            echo -e "${BLUE}Container logs (last 10 lines):${NC}"
            docker logs --tail 10 test-dev
            
            # Clean up
            echo ""
            read -p "Press Enter to stop and remove test container..."
            docker stop test-dev
            docker rm test-dev
        else
            echo -e "${RED}✗ Development container failed to start${NC}"
            docker logs test-dev
            docker rm test-dev
        fi
    else
        echo -e "${RED}✗ Development image build failed${NC}"
    fi
}

# Function to test docker-compose
test_compose() {
    echo ""
    echo -e "${BLUE}Testing Docker Compose Setup...${NC}"
    
    read -p "Test production (p) or development (d) compose? [p/d]: " compose_env
    
    if [ "$compose_env" = "d" ]; then
        echo -e "${YELLOW}Testing development compose...${NC}"
        docker-compose -f docker-compose.dev.yml build
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Development compose build successful${NC}"
            echo ""
            echo -e "${YELLOW}To start: docker-compose -f docker-compose.dev.yml up${NC}"
        fi
    else
        echo -e "${YELLOW}Testing production compose...${NC}"
        docker-compose -f docker-compose.yml build
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Production compose build successful${NC}"
            echo ""
            echo -e "${YELLOW}To start: docker-compose up${NC}"
        fi
    fi
}

# Main menu
main() {
    check_docker
    
    echo ""
    echo -e "${BLUE}Select build to test:${NC}"
    echo "1) Production build (Nginx + optimized)"
    echo "2) Development build (hot-reload)"
    echo "3) Docker Compose"
    echo "4) All builds"
    echo "5) Exit"
    
    read -p "Enter choice [1-5]: " choice
    
    case $choice in
        1)
            test_production
            ;;
        2)
            test_development
            ;;
        3)
            test_compose
            ;;
        4)
            test_production
            test_development
            test_compose
            ;;
        5)
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Docker Build Test Complete${NC}"
    echo -e "${GREEN}========================================${NC}"
}

# Run main function
main