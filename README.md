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
