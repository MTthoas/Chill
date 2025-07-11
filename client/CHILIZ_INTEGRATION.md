# Intégration Smart Contracts Chiliz

Cette documentation explique comment votre front-end React Native est configuré pour interfacer avec vos smart contracts Chiliz.

## 🏗️ Architecture

### Smart Contracts
- **ChilizFanTokenTrading.sol** : Contrat principal pour l'achat/vente de fan tokens
- **FanToken.sol** : Contrat ERC20 étendu pour les fan tokens avec métadonnées d'équipe
- **MockCHZToken.sol** : Token CHZ pour les tests

### Structure Front-end
```
client/
├── contracts/
│   ├── abi/                          # ABIs des contrats
│   ├── types/                        # Types TypeScript générés
│   ├── ChilizTradingService.ts       # Service principal
│   └── chilizConfig.ts               # Configuration des adresses
├── hooks/
│   └── useChilizTrading.ts           # Hook React personnalisé
├── components/
│   ├── FanTokenTrading.tsx           # Interface de trading
│   ├── FanTokenPortfolio.tsx         # Portfolio utilisateur
│   └── ChilizDashboard.tsx           # Dashboard principal
└── app/(tabs)/
    └── trading_new.tsx               # Page de trading intégrée
```

## 🔧 Configuration

### 1. Adresses des Contrats

Modifiez `contracts/chilizConfig.ts` avec vos adresses déployées :

```typescript
export const CHILIZ_CONTRACTS = {
  88888: { // Chiliz Mainnet
    CHZ_TOKEN: "VOTRE_ADRESSE_CHZ",
    FAN_TOKEN_TRADING: "VOTRE_ADRESSE_TRADING_CONTRACT",
    SUPPORTED_FAN_TOKENS: {
      "PSG": "ADRESSE_PSG_TOKEN",
      "BAR": "ADRESSE_BAR_TOKEN",
      // ...
    }
  },
  88882: { // Chiliz Testnet
    CHZ_TOKEN: "VOTRE_ADRESSE_CHZ_TESTNET",
    FAN_TOKEN_TRADING: "VOTRE_ADRESSE_TRADING_CONTRACT_TESTNET",
    // ...
  }
};
```

### 2. Métadonnées des Équipes

Ajoutez les métadonnées de vos équipes dans `chilizConfig.ts` :

```typescript
export const TEAM_METADATA = {
  "PSG": {
    name: "Paris Saint-Germain",
    league: "Ligue 1",
    country: "France",
    logo: "URL_DU_LOGO",
    colors: {
      primary: "#004170",
      secondary: "#ED174C"
    }
  },
  // ...
};
```

## 🚀 Utilisation

### Hook useChilizTrading

Le hook principal fournit toutes les fonctionnalités nécessaires :

```typescript
const {
  // État
  isLoading,
  error,
  isChilizNetwork,
  
  // Données
  supportedTokens,
  fanTokensInfo,
  userBalances,
  chzBalance,
  
  // Actions
  refreshData,
  buyTokens,
  sellTokens,
  getBuyQuote,
  getSellQuote,
} = useChilizTrading();
```

### Exemples d'Utilisation

#### Acheter des Fan Tokens
```typescript
try {
  const result = await buyTokens(tokenAddress, "100"); // 100 tokens
  console.log('Achat réussi:', result);
} catch (error) {
  console.error('Erreur d\'achat:', error);
}
```

#### Vendre des Fan Tokens
```typescript
try {
  const result = await sellTokens(tokenAddress, "50"); // 50 tokens
  console.log('Vente réussie:', result);
} catch (error) {
  console.error('Erreur de vente:', error);
}
```

#### Obtenir un Devis
```typescript
const buyPrice = await getBuyQuote(tokenAddress, "100");
const sellPrice = await getSellQuote(tokenAddress, "100");
```

## 🔐 Sécurité

### Approbations Automatiques
Le service gère automatiquement les approbations ERC20 :
- Vérifie l'allowance actuelle
- Approuve seulement le montant nécessaire
- Gère les erreurs d'approbation

### Validation des Transactions
- Vérification des soldes avant transaction
- Validation des montants minimum
- Gestion des erreurs de réseau

## 🎨 Interface Utilisateur

### Composants Principaux

1. **ChilizDashboard** : Point d'entrée principal avec navigation par onglets
2. **FanTokenTrading** : Interface de trading avec sélection de tokens et formulaire
3. **FanTokenPortfolio** : Affichage du portfolio utilisateur

### Fonctionnalités UI

- **Sélection de Tokens** : Liste avec logos et métadonnées des équipes
- **Calcul de Prix en Temps Réel** : Devis automatique basé sur les montants
- **Affichage des Soldes** : CHZ et fan tokens en temps réel
- **Feedback Visuel** : Loading states, erreurs, confirmations

## 🔄 Gestion d'État

### Rafraîchissement Automatique
- Rechargement des données après chaque transaction
- Pull-to-refresh sur les listes
- Gestion des erreurs de réseau

### Événements de Contrat
Le service peut écouter les événements blockchain :

```typescript
service.onTokensPurchased((buyer, tokenAddress, amount, chzPaid) => {
  console.log('Achat détecté:', { buyer, tokenAddress, amount, chzPaid });
});

service.onTokensSold((seller, tokenAddress, amount, chzReceived) => {
  console.log('Vente détectée:', { seller, tokenAddress, amount, chzReceived });
});
```

## 🧪 Tests et Développement

### Réseau de Test
Le code supporte automatiquement :
- Chiliz Mainnet (88888)
- Chiliz Testnet (88882)
- Localhost/Hardhat (31337)

### Variables d'Environnement
Ajoutez dans votre `.env` :
```
EXPO_PUBLIC_CHILIZ_MAINNET_RPC=https://rpc.ankr.com/chiliz
EXPO_PUBLIC_CHILIZ_TESTNET_RPC=https://spicy-rpc.chiliz.com
```

## 📦 Dépendances

### Packages Requis
```json
{
  "ethers": "^6.x",
  "wagmi": "^2.x",
  "@reown/appkit-wagmi-react-native": "^1.x"
}
```

### Scripts NPM
```bash
# Générer les types TypeScript
npm run typechain

# Démarrer l'app
npm start
```

## 🐛 Dépannage

### Erreurs Communes

1. **"Service non initialisé"**
   - Vérifiez que vous êtes connecté au bon réseau
   - Vérifiez les adresses de contrat dans `chilizConfig.ts`

2. **"Insufficient allowance"**
   - Le service gère normalement les approbations automatiquement
   - Vérifiez le solde CHZ de l'utilisateur

3. **"Token does not exist"**
   - Vérifiez que le token est ajouté au contrat de trading
   - Vérifiez l'adresse du token dans la configuration

### Logs de Debug
Activez les logs détaillés en définissant :
```typescript
console.log('ChilizTrading Debug:', { 
  service, 
  isConnected, 
  chainId, 
  contracts 
});
```

## 🚀 Déploiement

### Étapes de Déploiement

1. **Déployez vos contrats** sur Chiliz Mainnet/Testnet
2. **Mettez à jour** les adresses dans `chilizConfig.ts`
3. **Ajoutez les fan tokens** via les fonctions d'administration du contrat
4. **Testez** l'interface sur testnet
5. **Déployez** l'application mobile

### Configuration Production
- Utilisez des URLs RPC fiables
- Configurez la gestion d'erreur robuste
- Activez les analytics pour le suivi des transactions

---

🎉 **Votre front-end est maintenant intégré avec vos smart contracts Chiliz !**

Pour plus d'aide, consultez la documentation Chiliz ou les exemples de code dans les composants.
