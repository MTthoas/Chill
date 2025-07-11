# Configuration pour le déploiement des contrats Chiliz

# Variables d'environnement requises
PRIVATE_KEY=your_private_key_here
CHILIZ_MAINNET_RPC=https://rpc.ankr.com/chiliz
CHILIZ_TESTNET_RPC=https://spicy-rpc.chiliz.com

# Commandes de déploiement

## Déploiement sur Chiliz Testnet
forge script script/DeployChilizTrending.s.sol:DeployContracts --rpc-url $CHILIZ_TESTNET_RPC --broadcast --verify

## Déploiement sur Chiliz Mainnet  
forge script script/DeployChilizTrending.s.sol:DeployContracts --rpc-url $CHILIZ_MAINNET_RPC --broadcast --verify

## Déploiement local pour tests
forge script script/DeployChilizTrending.s.sol:DeployContracts --rpc-url http://localhost:8545 --broadcast

# Vérification des contrats (après déploiement)
forge verify-contract <CONTRACT_ADDRESS> <CONTRACT_NAME> --rpc-url <RPC_URL> --etherscan-api-key <API_KEY>

# Exemples d'interaction avec les contrats déployés

## Mint CHZ tokens pour tests
cast send <CHZ_TOKEN_ADDRESS> "mint(address,uint256)" <RECIPIENT> 1000000000000000000000000 --rpc-url <RPC_URL> --private-key <PRIVATE_KEY>

## Ajouter un nouveau fan token
cast send <TRADING_CONTRACT> "addFanToken(address,string,string,uint256,uint256,uint256)" <TOKEN_ADDRESS> "Team Name" "SYMBOL" 100000000000000000 90000000000000000 1000000000000000000 --rpc-url <RPC_URL> --private-key <PRIVATE_KEY>

## Mettre à jour les prix d'un token
cast send <TRADING_CONTRACT> "updateTokenPrices(address,uint256,uint256)" <TOKEN_ADDRESS> 110000000000000000 100000000000000000 --rpc-url <RPC_URL> --private-key <PRIVATE_KEY>

# Scripts d'administration

## Pause/Unpause du contrat
cast send <TRADING_CONTRACT> "pause()" --rpc-url <RPC_URL> --private-key <PRIVATE_KEY>
cast send <TRADING_CONTRACT> "unpause()" --rpc-url <RPC_URL> --private-key <PRIVATE_KEY>

## Retirer les fonds (owner only)
cast send <TRADING_CONTRACT> "withdrawFunds(uint256)" 1000000000000000000000 --rpc-url <RPC_URL> --private-key <PRIVATE_KEY>

## Ajouter de la liquidité
cast send <TRADING_CONTRACT> "addLiquidity(address,uint256)" <TOKEN_ADDRESS> 100000000000000000000000 --rpc-url <RPC_URL> --private-key <PRIVATE_KEY>

# Lecture des données

## Obtenir les tokens supportés
cast call <TRADING_CONTRACT> "getSupportedTokens()" --rpc-url <RPC_URL>

## Obtenir les infos d'un fan token
cast call <TRADING_CONTRACT> "getFanTokenInfo(address)" <TOKEN_ADDRESS> --rpc-url <RPC_URL>

## Obtenir le prix d'achat/vente
cast call <TRADING_CONTRACT> "getBuyPrice(address,uint256)" <TOKEN_ADDRESS> 1000000000000000000 --rpc-url <RPC_URL>
cast call <TRADING_CONTRACT> "getSellPrice(address,uint256)" <TOKEN_ADDRESS> 1000000000000000000 --rpc-url <RPC_URL>

## Obtenir les réserves
cast call <TRADING_CONTRACT> "getTokenReserves(address)" <TOKEN_ADDRESS> --rpc-url <RPC_URL>

# Notes importantes :
# - Tous les montants sont en wei (1 token = 1e18 wei)
# - Assurez-vous d'avoir suffisamment d'ETH/CHZ pour les gas fees
# - Testez toujours sur testnet avant le mainnet
# - Sauvegardez vos clés privées en sécurité
