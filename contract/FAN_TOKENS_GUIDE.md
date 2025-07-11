# 🏆 Fan Tokens Trading System - Guide d'Utilisation

## 📋 Tokens Déployés

Après déploiement, vous avez maintenant **6 fan tokens personnalisés** :

### 🔵 PSG (Paris Saint-Germain)
- **Adresse**: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- **Prix d'achat**: 2 CHZ par token
- **Prix de vente**: 1.8 CHZ par token
- **Supply initial**: 20M tokens

### ⚪ RMA (Real Madrid)
- **Adresse**: `0x0165878A594ca255338adfa4d48449f69242Eb8F`
- **Prix d'achat**: 2.5 CHZ par token
- **Prix de vente**: 2.2 CHZ par token
- **Supply initial**: 25M tokens

### 🔴 BAR (FC Barcelona)
- **Adresse**: `0x610178dA211FEF7D417bC0e6FeD39F05609AD788`
- **Prix d'achat**: 2.3 CHZ par token
- **Prix de vente**: 2.0 CHZ par token
- **Supply initial**: 22M tokens

### 🔵 CITY (Manchester City)
- **Adresse**: `0x9A676e781A523b5d0C0e43731313A708CB607508`
- **Prix d'achat**: 2.1 CHZ par token
- **Prix de vente**: 1.9 CHZ par token
- **Supply initial**: 18M tokens

### ⚫ JUV (Juventus)
- **Adresse**: `0x68B1D87F95878fE05B998F19b66F4baba5De1aed`
- **Prix d'achat**: 1.9 CHZ par token
- **Prix de vente**: 1.7 CHZ par token
- **Supply initial**: 20M tokens

### 🔴 BAY (Bayern Munich)
- **Adresse**: `0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1`
- **Prix d'achat**: 2.4 CHZ par token
- **Prix de vente**: 2.1 CHZ par token
- **Supply initial**: 21M tokens

## 🏢 Contrats Système

- **CHZ Token**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **Trading Contract**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

## 🚀 Comment Utiliser

### 1. Acheter des Fan Tokens

```solidity
// 1. Vérifier le prix
uint256 price = trading.getBuyPrice(psgTokenAddress, 100 ether); // 100 PSG tokens

// 2. Approuver CHZ
chzToken.approve(tradingAddress, price);

// 3. Acheter
trading.buyFanTokens(psgTokenAddress, 100 ether);
```

### 2. Vendre des Fan Tokens

```solidity
// 1. Vérifier le prix de vente
uint256 payout = trading.getSellPrice(psgTokenAddress, 50 ether); // 50 PSG tokens

// 2. Approuver les fan tokens
psgToken.approve(tradingAddress, 50 ether);

// 3. Vendre
trading.sellFanTokens(psgTokenAddress, 50 ether);
```

### 3. Consulter les Informations

```solidity
// Obtenir les informations d'une équipe
(string memory name, string memory league, string memory country, , uint256 supply, uint256 maxSupply) = 
    psgToken.getTeamInfo();

// Vérifier les réserves disponibles
uint256 reserves = trading.getTokenReserves(psgTokenAddress);

// Lister tous les tokens supportés
address[] memory tokens = trading.getSupportedTokens();
```

## 💡 Fonctionnalités des Fan Tokens

### Métadonnées Riches
Chaque fan token contient :
- ✅ Nom de l'équipe
- ✅ Ligue
- ✅ Pays
- ✅ URL du logo
- ✅ Supply maximum (100M tokens)

### Fonctions Avancées
- ✅ Mint de nouveaux tokens (propriétaire seulement)
- ✅ Burn de tokens (propriétaire seulement)
- ✅ Pause des transferts (propriétaire seulement)
- ✅ Mise à jour des métadonnées

### Sécurité
- ✅ OpenZeppelin Ownable
- ✅ OpenZeppelin Pausable
- ✅ Vérifications de dépassement
- ✅ Protection contre les reentrancy

## 🧪 Tests

Tous les tests passent (8/8) :
- ✅ Déploiement des tokens
- ✅ Achat de tokens PSG
- ✅ Vente de tokens Real Madrid
- ✅ Trading multi-équipes
- ✅ Mint et burn
- ✅ Calculs de prix
- ✅ Récupération des informations

## 📊 Frais de Trading

- **Frais par défaut**: 1% (100 points de base)
- **Frais maximum**: 10% (configurable par le propriétaire)
- **Calcul**: Appliqué sur le prix total lors de l'achat/vente

## 🔧 Administration

Le propriétaire du contrat peut :
- Ajouter de nouveaux fan tokens
- Mettre à jour les prix
- Activer/désactiver des tokens
- Modifier les frais de trading
- Ajouter/retirer de la liquidité
- Pauser le contrat en urgence

---

## 🎯 Avantages vs Système Précédent

| Fonctionnalité | Avant (Adresses externes) | Maintenant (Tokens créés) |
|---|---|---|
| **Contrôle total** | ❌ Dépendant d'autres projets | ✅ Contrôle complet |
| **Métadonnées** | ❌ Limitées | ✅ Riches (équipe, ligue, pays) |
| **Supply** | ❌ Fixe, non contrôlable | ✅ Contrôlable (mint/burn) |
| **Fonctionnalités** | ❌ Basiques ERC20 | ✅ Pause, mint, burn, metadata |
| **Personnalisation** | ❌ Impossible | ✅ Totale (logo, infos équipe) |
| **Tests** | ❌ Difficiles avec mocks | ✅ Tests réels et complets |

Votre système est maintenant **prêt pour la production** avec des fan tokens entièrement personnalisés ! 🚀
