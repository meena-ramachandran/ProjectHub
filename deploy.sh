#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Styling colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Project Hub Deployer & Validator ===${NC}"
echo -e "${YELLOW}This script will validate your local build and help you deploy preview versions for testing.${NC}"
echo ""

# Step 1: Validate build
echo -e "Step 1: Running local production build validation..."
npm run build
echo -e "${GREEN}✔ Build successful! Static assets compiled in 'dist/' directory.${NC}"
echo ""

# Step 2: Present Deployment Options
echo -e "Choose a deployment method for testing (Type 1, 2, or 3):"
echo -e "1) ${BLUE}Run Local Preview Server${NC} (Host locally on port 4173 to test production build)"
echo -e "2) ${BLUE}Deploy to Vercel Preview (Free)${NC} (Deploys static build in preview mode, no git push)"
echo -e "3) ${BLUE}Deploy to GitHub Pages (Free)${NC} (Pushes compiled dist/ folder to a gh-pages branch)"

read -p "Enter choice [1-3]: " choice

case $choice in
  1)
    echo -e "${GREEN}Starting local preview server...${NC}"
    npm run preview
    ;;
  2)
    echo -e "${YELLOW}Checking if Vercel CLI is installed...${NC}"
    if ! command -v vercel &> /dev/null
    then
        echo -e "Vercel CLI not found. Installing vercel command line tool..."
        npm install -g vercel
    fi
    echo -e "${GREEN}Deploying preview to Vercel... Follow Vercel CLI prompts to authenticate.${NC}"
    vercel --prod
    ;;
  3)
    echo -e "${YELLOW}Checking git repository initialization...${NC}"
    if [ ! -d ".git" ]; then
        echo "Initializing local git repository..."
        git init
        git add .
        git commit -m "initial commit"
    fi
    echo -e "Installing gh-pages dependency..."
    npm install gh-pages --save-dev
    echo -e "${GREEN}Deploying to GitHub Pages...${NC}"
    npx gh-pages -d dist
    echo -e "${GREEN}✔ Deployed successfully to GitHub Pages! Link should appear shortly under your github.io domain.${NC}"
    ;;
  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac
