# Portfolio Manager Frontend

A React-based web application for managing investment portfolios with real-time stock data from Yahoo Finance.

## Features

- **Authentication**: Secure login with token-based authentication
- **Portfolio Management**: Create, view, and manage multiple portfolios
- **Stock Search**: Search and add stocks using Yahoo Finance integration
- **Position Tracking**: Add stock positions with purchase details
- **Real-time Data**: Refresh stock prices and calculate gains/losses
- **Responsive Design**: Clean, modern UI that works on desktop and mobile

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Running Django backend on port 8000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The application will open in your browser at `http://localhost:3000`.

### Default Login

- Username: `admin`
- Password: `admin123`

## Usage

1. **Login**: Use the default credentials or your custom user account
2. **Create Portfolio**: Click "New Portfolio" to create your first portfolio
3. **Add Positions**: 
   - Open a portfolio and click "Add Position"
   - Search for a stock symbol (e.g., AAPL, GOOGL, MSFT)
   - Enter quantity, purchase price, and date
4. **View Performance**: See real-time portfolio value, costs, and gains/losses
5. **Refresh Prices**: Click "Refresh Prices" to get current stock data

## API Integration

The frontend communicates with a Django REST API backend that provides:
- User authentication
- Portfolio CRUD operations
- Stock data from Yahoo Finance
- Position management
- Real-time price updates

## Architecture

- **React**: Frontend framework with functional components and hooks
- **Axios**: HTTP client for API communication
- **Lucide React**: Icons and visual elements
- **CSS**: Custom utility classes for styling (Tailwind-inspired)

## Components

- `Login`: Authentication form
- `Navbar`: Top navigation with logout
- `PortfolioList`: Grid view of all portfolios
- `PortfolioDetail`: Detailed portfolio view with positions
- `CreatePortfolio`: Modal for creating new portfolios
- `AddPosition`: Modal for adding stock positions with search
- `ApiService`: Centralized API communication

---

# Original Create React App Documentation

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
