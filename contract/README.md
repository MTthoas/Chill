# 🏆 Chiliz Fan Tokens Trading System

## 📋 Aperçu

Système complet de trading pour des **fan tokens personnalisés** sur la blockchain Chiliz. Créez et tradez vos propres tokens d'équipes de football avec des métadonnées riches et des fonctionnalités avancées.

## 🏗️ Architecture

### Contrats Principaux

1. **FanToken.sol** - Token ERC20 personnalisé pour les équipes
   - Métadonnées riches (équipe, ligue, pays, logo)
   - Supply contrôlable (mint/burn)
   - Fonctions de pause
   - Supply maximum de 100M tokens

2. **ChilizFanTokenTrading.sol** - Contrat de trading principal
   - Achat/vente de fan tokens avec CHZ
   - Calcul automatique des prix avec frais
   - Gestion de liquidité
   - Sécurité OpenZeppelin (ReentrancyGuard, Pausable, Ownable)

3. **MockCHZToken.sol** - Token CHZ pour les tests
   - Implémentation basique ERC20
   - Fonction mint pour les tests

## 🚀 Installation

```bash
# Cloner le repo
git clone <your-repo>
cd contract

# Installer les dépendances
forge install

# Compiler
forge build

# Tester
forge test
```

## 🧪 Tests

Tous les tests sont localisés dans `/test/` :

- **ChilizFanTokenTrading.t.sol** - Tests du contrat de trading principal
- **FanTokens.t.sol** - Tests des fan tokens personnalisés

```bash
# Lancer tous les tests
forge test

# Tests avec rapport de gas
forge test --gas-report

# Tests spécifiques
forge test --match-test testBuyPSGTokens
```

## 📦 Déploiement

### Script de Déploiement

Le script `DeployFanTokens.s.sol` déploie automatiquement :
- 6 fan tokens d'équipes populaires (PSG, Real Madrid, Barcelona, etc.)
- Le contrat de trading
- Configuration des prix et liquidité initiale

```bash
# Déploiement local avec Anvil
anvil --port 8545

# Dans un autre terminal
PRIVATE_KEY=Ox.. \
forge script script/DeployFanTokens.s.sol \
--rpc-url http://localhost:8545 \
--broadcast
```

### Équipes Préconfigurées

Le script déploie 6 fan tokens :

| Équipe | Symbole | Prix Achat | Prix Vente | Supply Initial |
|--------|---------|------------|------------|----------------|
| PSG | PSG | 2 CHZ | 1.8 CHZ | 20M tokens |
| Real Madrid | RMA | 2.5 CHZ | 2.2 CHZ | 25M tokens |
| Barcelona | BAR | 2.3 CHZ | 2.0 CHZ | 22M tokens |
| Manchester City | CITY | 2.1 CHZ | 1.9 CHZ | 18M tokens |
| Juventus | JUV | 1.9 CHZ | 1.7 CHZ | 20M tokens |
| Bayern Munich | BAY | 2.4 CHZ | 2.1 CHZ | 21M tokens |

## 💡 Utilisation

### Acheter des Fan Tokens

```solidity
// 1. Obtenir le prix
uint256 price = trading.getBuyPrice(psgTokenAddress, 100 ether);

// 2. Approuver CHZ
chzToken.approve(tradingAddress, price);

// 3. Acheter
trading.buyFanTokens(psgTokenAddress, 100 ether);
```

### Vendre des Fan Tokens

```solidity
// 1. Obtenir le prix de vente
uint256 payout = trading.getSellPrice(psgTokenAddress, 50 ether);

// 2. Approuver les fan tokens
psgToken.approve(tradingAddress, 50 ether);

// 3. Vendre
trading.sellFanTokens(psgTokenAddress, 50 ether);
```

### Consulter les Informations

```solidity
// Informations d'une équipe
(string memory name, string memory league, string memory country, , uint256 supply, uint256 maxSupply) = 
    psgToken.getTeamInfo();

// Réserves disponibles
uint256 reserves = trading.getTokenReserves(psgTokenAddress);

// Tous les tokens supportés
address[] memory tokens = trading.getSupportedTokens();
```

## 🔧 Fonctionnalités Avancées

### Fan Token Features
- ✅ Métadonnées riches (nom équipe, ligue, pays, logo)
- ✅ Supply contrôlable (mint/burn par le propriétaire)
- ✅ Pause des transferts
- ✅ Supply maximum de 100M tokens
- ✅ Events pour tracking des changements

### Trading Features
- ✅ Frais de trading configurables (défaut 1%)
- ✅ Gestion de liquidité
- ✅ Prix fixe par token
- ✅ Montant minimum de trading
- ✅ Pause d'urgence
- ✅ Protection ReentrancyGuard

### Sécurité
- ✅ OpenZeppelin Ownable
- ✅ OpenZeppelin ReentrancyGuard
- ✅ OpenZeppelin Pausable
- ✅ SafeERC20 pour les transferts
- ✅ Vérifications de dépassement

## 📊 Performance Gas

| Action | Gas Utilisé |
|--------|-------------|
| Déploiement FanToken | ~2.3M gas |
| Déploiement Trading | ~3.4M gas |
| Achat de tokens | ~86k gas |
| Vente de tokens | ~81k gas |

## 📚 Documentation

Consultez `FAN_TOKENS_GUIDE.md` pour un guide détaillé d'utilisation avec exemples et bonnes pratiques.

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier `LICENSE` pour plus de détails.
