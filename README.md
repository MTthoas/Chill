# 🏆 TAKUMI PRO - Next-Gen Fan Token Platform

<div align="center">

![Takumi Pro](https://img.shields.io/badge/Takumi%20Pro-Next--Gen%20Platform-8b5cf6?style=for-the-badge&logo=football&logoColor=white)
![Chiliz](https://img.shields.io/badge/Powered%20by-Chiliz-FF7700?style=for-the-badge&logo=ethereum&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

*AI-powered insights for data-driven fan token trading*

[🚀 Demo](#demo) • [📱 Features](#features) • [🛠️ Tech Stack](#tech-stack) • [⚡ Quick Start](#quick-start)

</div>

---

## 🎯 Overview

**Takumi Pro** helps you buy and sell fan tokens like a data-driven analyst — not a random gambler. Get AI-powered insights from past matches, upcoming fixtures, and league stats, right in your pocket.

### 🤖 Powered by AI Agents & Sports Data

- **Smart Analytics**: AI-driven market insights based on team performance
- **Real-time Data**: Live sports statistics and match predictions
- **Professional Tools**: Advanced portfolio tracking and yield farming
- **Secure Trading**: Built on Chiliz blockchain infrastructure

---

## 📱 Features

### 🏠 **Dashboard & Portfolio**
- **Premium Landing Page**: Stunning OKX-style interface for new users
- **Real-time Portfolio Tracking**: Live balance updates with accurate pricing
- **Multi-Token Support**: CHZ + Fan Tokens (PSG, CITY, BAR, ACM, AFC)
- **Smart Filtering**: Hide small balances, advanced token filtering

### ⚽ **Sports Integration**
- **League Management**: Browse and explore different sports leagues
- **Team Analytics**: Detailed team statistics and performance metrics
- **Match Predictions**: AI-powered insights for upcoming fixtures
- **Live Data**: Real-time sports data integration

### 💰 **Yield Farming & Staking**
- **Season Staking Pools**: Stake PSG Fan Tokens to earn CHILL rewards
- **Smart Contracts**: Secure, audited staking mechanisms
- **Reward Management**: Automated reward distribution and claiming
- **Pool Management**: Dynamic pool status and timing controls

### 🔗 **Web3 Integration**
- **Wallet Connect**: Seamless connection with popular wallets
- **Chiliz Network**: Native integration with Chiliz blockchain
- **Multi-Chain Support**: Ready for expansion to other networks
- **DeFi Ready**: Built for decentralized finance operations

---

## 🛠️ Tech Stack

### 📱 **Frontend (React Native)**
```
React Native 0.79.5 + Expo 53
TypeScript for type safety
Wagmi + Viem for Web3 integration
Reown AppKit for wallet connections
```

### 🌐 **Backend (Node.js + Express)**
```
Express.js REST API
Prisma ORM with PostgreSQL
TypeScript for backend logic
Vercel deployment ready
```

### ⛓️ **Blockchain (Solidity + Foundry)**
```
Solidity smart contracts
Foundry development framework
OpenZeppelin security standards
Chiliz blockchain deployment
```

### 🤖 **AI Agents (Python)**
```
Python-based AI agents
Sports data analysis
Market prediction algorithms
Docker containerization
```

---

## ⚡ Quick Start

### 📋 Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **Git**
- **Expo CLI** (for mobile development)
- **Foundry** (for smart contracts)

### 🚀 Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/takumi-pro.git
cd takumi-pro
```

2. **Install dependencies**
```bash
# Install client dependencies
cd client
npm install

# Install API dependencies
cd ../api
npm install

# Install contract dependencies
cd ../contract
forge install
```

3. **Environment setup**
```bash
# Client (.env)
cd client
cp .env.example .env
# Add your WalletConnect Project ID and other configs

# API (.env)
cd ../api
cp .env.example .env
# Add your database URL and API keys
```

4. **Database setup**
```bash
cd api
npm run db:migrate
npm run db:push
```

5. **Smart contracts deployment**
```bash
cd contract
forge build
forge script script/DeploySeasonFanTokenPool.s.sol --rpc-url chiliz
```

### 📱 Running the Application

**Start the API server:**
```bash
cd api
npm run dev
```

**Start the mobile app:**
```bash
cd client
npm start
```

**Access via Expo:**
- Scan QR code with Expo Go app (iOS/Android)
- Press `w` for web development
- Press `i` for iOS simulator
- Press `a` for Android emulator

---

## 📁 Project Structure

```
takumi-pro/
├── 📱 client/           # React Native mobile app
│   ├── app/            # Expo Router pages
│   ├── components/     # Reusable components
│   ├── hooks/          # Custom React hooks
│   ├── contracts/      # Smart contract integration
│   └── assets/         # Images and fonts
├── 🌐 api/             # Express.js backend
│   ├── src/           # API source code
│   ├── prisma/        # Database schema & migrations
│   └── scripts/       # Utility scripts
├── ⛓️ contract/        # Solidity smart contracts
│   ├── src/           # Contract source files
│   ├── script/        # Deployment scripts
│   ├── test/          # Contract tests
│   └── out/           # Compiled contracts
└── 🤖 agents/          # Python AI agents
    ├── agent.py       # Main agent logic
    └── bigBoy.py      # Advanced analytics
```

---

## 🔧 Configuration

### 🌐 **API Configuration**

```env
DATABASE_URL="postgresql://username:password@localhost:5432/takumi"
SPORTS_API_KEY="your-sports-api-key"
PORT=3000
```

### 📱 **Client Configuration**

```env
EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID="your-project-id"
EXPO_PUBLIC_API_URL="http://localhost:3000"
EXPO_PUBLIC_CHILIZ_RPC="https://rpc.ankr.com/chiliz"
```

### ⛓️ **Contract Configuration**

```env
PRIVATE_KEY="your-private-key"
CHILIZ_RPC_URL="https://rpc.ankr.com/chiliz"
ETHERSCAN_API_KEY="your-etherscan-key"
```

---

## 🎯 Key Features Breakdown

### 🏠 **Landing Page Experience**
- **Hero Section**: Stunning visual with sports imagery
- **Feature Showcase**: Horizontal scrolling premium cards
- **Trust Indicators**: Impressive statistics and social proof
- **Smooth Onboarding**: One-click wallet connection

### 📊 **Portfolio Management**
- **Real-time Pricing**: CoinGecko API integration with fallback prices
- **Smart Filtering**: Automatic filtering of tokens below $1 value
- **Performance Tracking**: Historical gains and portfolio analytics
- **Multi-token Support**: Comprehensive fan token ecosystem

### ⚽ **Sports Intelligence**
- **AI-Powered Insights**: Machine learning algorithms for predictions
- **Live Match Data**: Real-time scores and statistics
- **Team Analytics**: Historical performance and trend analysis
- **League Management**: Multi-league support with detailed standings

### 💎 **Yield Farming**
- **Season Pools**: Time-limited staking opportunities
- **Reward Distribution**: Automated reward calculations
- **Security First**: Audited smart contracts with safety mechanisms
- **User-Friendly**: Simple stake/unstake/claim interface

---

## 🚀 Deployment

### 📱 **Mobile App Deployment**

**iOS App Store:**
```bash
cd client
eas build --platform ios
eas submit --platform ios
```

**Google Play Store:**
```bash
cd client
eas build --platform android
eas submit --platform android
```

### 🌐 **API Deployment (Vercel)**

```bash
cd api
vercel --prod
```

### ⛓️ **Smart Contract Deployment**

```bash
cd contract
forge script script/DeploySeasonFanTokenPool.s.sol \
  --rpc-url chiliz \
  --broadcast \
  --verify
```

---

## 🧪 Testing

### 📱 **Client Testing**
```bash
cd client
npm run lint
npm run test
```

### 🌐 **API Testing**
```bash
cd api
npm run test
npm run test:coverage
```

### ⛓️ **Contract Testing**
```bash
cd contract
forge test
forge coverage
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### 🌟 **How to contribute:**

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Website**: [takumi-pro.com](https://takumi-pro.com)
- **Documentation**: [docs.takumi-pro.com](https://docs.takumi-pro.com)
- **Twitter**: [@TakumiPro](https://twitter.com/TakumiPro)
- **Discord**: [Join our community](https://discord.gg/takumi-pro)

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=your-username/takumi-pro&type=Date)](https://star-history.com/#your-username/takumi-pro&Date)

---

<div align="center">

**Built with ❤️ by the Takumi Pro Team**

*Powering the future of fan token trading*

</div>