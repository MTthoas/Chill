// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/FanToken.sol";
import "../src/MockCHZToken.sol";
import "../src/ChilizFanTokenTrading.sol";

/**
 * @title DeployFanTokens
 * @dev Script pour déployer plusieurs fan tokens et le système de trading
 */
contract DeployFanTokens is Script {
    
    struct TeamConfig {
        string name;
        string symbol;
        string teamName;
        string league;
        string country;
        string logoURI;
        uint256 initialSupply;
        uint256 buyPrice;   // Prix d'achat en CHZ (en wei)
        uint256 sellPrice;  // Prix de vente en CHZ (en wei)
        uint256 minTradeAmount;
    }
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Déployer le token CHZ de test
        MockCHZToken chzToken = new MockCHZToken();
        console.log("CHZ Token deployed at:", address(chzToken));
        
        // 2. Déployer le contrat de trading
        ChilizFanTokenTrading trading = new ChilizFanTokenTrading(address(chzToken));
        console.log("Trading Contract deployed at:", address(trading));
        
        // 3. Configuration des équipes
        TeamConfig[] memory teams = getTeamConfigurations();
        
        // 4. Déployer tous les fan tokens
        address[] memory fanTokenAddresses = new address[](teams.length);
        
        for (uint i = 0; i < teams.length; i++) {
            TeamConfig memory team = teams[i];
            
            // Déployer le fan token
            FanToken fanToken = new FanToken(
                team.name,
                team.symbol,
                team.teamName,
                team.league,
                team.country,
                team.logoURI,
                team.initialSupply
            );
            
            fanTokenAddresses[i] = address(fanToken);
            console.log(string(abi.encodePacked(team.symbol, " Token deployed at:")), address(fanToken));
            
            // Ajouter le token au contrat de trading
            trading.addFanToken(
                address(fanToken),
                team.name,
                team.symbol,
                team.buyPrice,
                team.sellPrice,
                team.minTradeAmount
            );
            
            // Transférer des tokens au contrat de trading pour la liquidité
            uint256 liquidityAmount = (team.initialSupply * 50) / 100; // 50% pour la liquidité
            
            // D'abord approuver le contrat de trading
            fanToken.approve(address(trading), liquidityAmount);
            
            // Puis ajouter la liquidité (qui fera le transferFrom)
            trading.addLiquidity(address(fanToken), liquidityAmount);
            
            console.log(string(abi.encodePacked("Added ", team.symbol, " to trading with liquidity")));
        }
        
        // 5. Mint des CHZ tokens pour les tests
        chzToken.mint(msg.sender, 1000000 * 10**18); // 1M CHZ
        chzToken.transfer(address(trading), 100000 * 10**18); // 100k CHZ pour la liquidité
        
        vm.stopBroadcast();
        
        // Afficher le résumé du déploiement
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("CHZ Token:", address(chzToken));
        console.log("Trading Contract:", address(trading));
        console.log("Number of Fan Tokens deployed:", teams.length);
        
        for (uint i = 0; i < teams.length; i++) {
            console.log(string(abi.encodePacked(teams[i].symbol, ":")), fanTokenAddresses[i]);
        }
    }
    
    function getTeamConfigurations() internal pure returns (TeamConfig[] memory) {
        TeamConfig[] memory teams = new TeamConfig[](6);
        
        // PSG
        teams[0] = TeamConfig({
            name: "Paris Saint-Germain Fan Token",
            symbol: "PSG",
            teamName: "Paris Saint-Germain",
            league: "Ligue 1",
            country: "France",
            logoURI: "https://example.com/psg-logo.png",
            initialSupply: 20000000, // 20M tokens
            buyPrice: 2 * 10**18,    // 2 CHZ par token
            sellPrice: 18 * 10**17,  // 1.8 CHZ par token
            minTradeAmount: 1 * 10**18 // 1 token minimum
        });
        
        // Real Madrid
        teams[1] = TeamConfig({
            name: "Real Madrid Fan Token",
            symbol: "RMA",
            teamName: "Real Madrid",
            league: "La Liga",
            country: "Spain",
            logoURI: "https://example.com/real-madrid-logo.png",
            initialSupply: 25000000, // 25M tokens
            buyPrice: 25 * 10**17,   // 2.5 CHZ par token
            sellPrice: 22 * 10**17,  // 2.2 CHZ par token
            minTradeAmount: 1 * 10**18
        });
        
        // FC Barcelona
        teams[2] = TeamConfig({
            name: "FC Barcelona Fan Token",
            symbol: "BAR",
            teamName: "FC Barcelona",
            league: "La Liga",
            country: "Spain",
            logoURI: "https://example.com/barcelona-logo.png",
            initialSupply: 22000000, // 22M tokens
            buyPrice: 23 * 10**17,   // 2.3 CHZ par token
            sellPrice: 20 * 10**17,  // 2.0 CHZ par token
            minTradeAmount: 1 * 10**18
        });
        
        // Manchester City
        teams[3] = TeamConfig({
            name: "Manchester City Fan Token",
            symbol: "CITY",
            teamName: "Manchester City",
            league: "Premier League",
            country: "England",
            logoURI: "https://example.com/man-city-logo.png",
            initialSupply: 18000000, // 18M tokens
            buyPrice: 21 * 10**17,   // 2.1 CHZ par token
            sellPrice: 19 * 10**17,  // 1.9 CHZ par token
            minTradeAmount: 1 * 10**18
        });
        
        // Juventus
        teams[4] = TeamConfig({
            name: "Juventus Fan Token",
            symbol: "JUV",
            teamName: "Juventus",
            league: "Serie A",
            country: "Italy",
            logoURI: "https://example.com/juventus-logo.png",
            initialSupply: 20000000, // 20M tokens
            buyPrice: 19 * 10**17,   // 1.9 CHZ par token
            sellPrice: 17 * 10**17,  // 1.7 CHZ par token
            minTradeAmount: 1 * 10**18
        });
        
        // Bayern Munich
        teams[5] = TeamConfig({
            name: "Bayern Munich Fan Token",
            symbol: "BAY",
            teamName: "Bayern Munich",
            league: "Bundesliga",
            country: "Germany",
            logoURI: "https://example.com/bayern-logo.png",
            initialSupply: 21000000, // 21M tokens
            buyPrice: 24 * 10**17,   // 2.4 CHZ par token
            sellPrice: 21 * 10**17,  // 2.1 CHZ par token
            minTradeAmount: 1 * 10**18
        });
        
        return teams;
    }
}
