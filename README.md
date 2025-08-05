# claude-code-learning
claude-code Learning

https://www.stephanmiller.com/electron-project-from-scratch-with-claude-code/
Features

  - User Authentication: Token-based authentication
  with DRF
  - Portfolio Management: Create, read, update, delete
  portfolios
  - Stock Management: Search and store stock
  information from Yahoo Finance
  - Position Tracking: Add stock positions to
  portfolios with purchase details
  - Real-time Data: Refresh stock prices using Yahoo
  Finance API
  - Financial Calculations: Automatic calculation of
  gains/losses and percentages

  API Endpoints

  - POST /api-token-auth/ - Get authentication token
  - GET/POST /api/portfolios/ - List/create portfolios
  - GET/PUT/DELETE /api/portfolios/{id}/ - Portfolio
  details/update/delete
  - POST /api/portfolios/{id}/add_position/ - Add
  position to portfolio
  - GET /api/portfolios/{id}/refresh_prices/ - Refresh
  stock prices
  - POST /api/stocks/search_yahoo/ - Search stocks via
  Yahoo Finance
  - GET/POST /api/positions/ - List/create positions

  Models

  - Portfolio: User's investment portfolio with
  calculated totals
  - Stock: Stock information with current prices from
  Yahoo Finance
  - Position: Individual stock positions within
  portfolios

  Usage

  1. Start server: source venv/bin/activate && python 
  manage.py runserver
  2. Get token: POST /api-token-auth/ with
  username/password
  3. Use token in Authorization header: Authorization: 
  Token <your-token>
  4. Create portfolios, search stocks, add positions,
  and track performance

  The API is fully functional and tested with real
  Yahoo Finance data integration.


  1. Start both servers:
    - Django: python manage.py runserver 8000
    - React: cd frontend && npm start
  2. Access the app: http://localhost:3000
  3. Login: admin / admin123
  4. Create portfolios and add stock positions with
  real Yahoo Finance data


Front-end:

##Stop##
pkill -f "react-scripts"


##Start##
cd /Users/kwood/projects/coding-repos/claude-code-learning/frontend && npm start







 Usage Commands:

  # Development (with hot reload)
  docker-compose up

  # Production frontend build
  docker build -t portfolio-frontend ./frontend

  # Run production frontend
  docker run -p 80:80 portfolio-frontend

  # Build and run everything
  docker-compose up --build

  Key Features:

  - Multi-stage builds for smaller production images
  - Hot reloading in development
  - Production optimization with nginx
  - Security headers and best practices
  - Health checks for container monitoring
  - Volume mounting for development workflow

  The setup is production-ready and follows Docker best practices!

⏺ Here are the equivalent Podman commands for the Docker setup:

  🦭 Podman Usage Commands

  Development (with hot reload):

  # Start all services in development mode
  podman-compose up

  # Start with build
  podman-compose up --build

  # Run in background
  podman-compose up -d

  Production Frontend Build:

  # Build production frontend image
  podman build -t portfolio-frontend ./frontend

  # Run production frontend container
  podman run -p 80:80 portfolio-frontend

  # Run with custom name
  podman run -d --name portfolio-frontend-prod -p 80:80 portfolio-frontend

  Backend Build:

  # Build backend image
  podman build -t portfolio-backend .

  # Run backend container
  podman run -p 8000:8000 portfolio-backend

  Individual Container Commands:

  # Build and run frontend dev container
  podman build -f frontend/Dockerfile.dev -t portfolio-frontend-dev ./frontend
  podman run -p 3000:3000 -v ./frontend:/app:Z portfolio-frontend-dev

  # Build and run backend container
  podman run -p 8000:8000 -v .:/app:Z portfolio-backend

  Podman-Compose Alternative (if not available):

  # Create a pod for networking
  podman pod create --name portfolio-pod -p 3000:3000 -p 8000:8000

  # Run backend in pod
  podman run -d --pod portfolio-pod --name backend \
    -v .:/app:Z portfolio-backend

  # Run frontend in pod
  podman run -d --pod portfolio-pod --name frontend \
    -v ./frontend:/app:Z portfolio-frontend-dev

  Management Commands:

  # View running containers
  podman ps

  # View all containers
  podman ps -a

  # Stop all containers
  podman-compose down

  # Remove containers and images
  podman-compose down --rmi all

  # View logs
  podman logs portfolio-frontend
  podman-compose logs frontend

  # Execute commands in running container
  podman exec -it portfolio-frontend /bin/sh

  Volume Management:

  # Create named volumes (optional)
  podman volume create portfolio-node-modules
  podman volume create portfolio-data

  # Run with named volumes
  podman run -v portfolio-node-modules:/app/node_modules:Z \
    -v ./frontend:/app:Z portfolio-frontend-dev

  Rootless Mode (Podman's default):

  # All commands run rootless by default in Podman
  # No need for sudo (unlike Docker)

  # Check if running rootless
  podman info | grep rootless

  Key Differences from Docker:

  - No daemon required - Podman runs containers directly
  - Rootless by default - Enhanced security
  - SELinux labels - Use :Z for volume mounts on SELinux systems
  - Pod concept - Can group containers like Kubernetes pods
  - Drop-in replacement - Most Docker commands work with podman substitution

  Production Deployment:

  # Build for production
  podman build -t portfolio-frontend:prod ./frontend
  podman build -t portfolio-backend:prod .

  # Run production stack
  podman run -d --name portfolio-backend-prod -p 8000:8000 portfolio-backend:prod
  podman run -d --name portfolio-frontend-prod -p 80:80 portfolio-frontend:prod

  The main advantage of Podman is that it runs daemonless and rootless, providing better
  security and requiring no background services!