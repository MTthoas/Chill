// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import "../src/ChilizFanTokenTrading.sol";
import "../src/FanToken.sol";
import "../src/MockCHZToken.sol";

contract DeployContracts is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Déployer le token CHZ mock (pour les tests)
        MockCHZToken chzToken = new MockCHZToken();
        console.log("CHZ Token deployed to:", address(chzToken));

        // 2. Déployer le contrat de trading
        ChilizFanTokenTrading tradingContract = new ChilizFanTokenTrading(address(chzToken));
        console.log("Trading Contract deployed to:", address(tradingContract));

        // 3. Déployer les fan tokens selon votre configuration
        FanToken psgToken = new FanToken(
            "Paris Saint-Germain Fan Token",
            "PSG",
            "Paris Saint-Germain",
            "Ligue 1",
            "France",
            "https://assets.socios.com/club-logos/psg-logo.png",
            20000000 // 20M tokens
        );
        console.log("PSG Token deployed to:", address(psgToken));

        FanToken rmaToken = new FanToken(
            "Real Madrid Fan Token",
            "RMA",
            "Real Madrid",
            "La Liga",
            "Spain",
            "https://assets.socios.com/club-logos/real-madrid-logo.png",
            25000000 // 25M tokens
        );
        console.log("RMA Token deployed to:", address(rmaToken));

        FanToken barToken = new FanToken(
            "FC Barcelona Fan Token",
            "BAR",
            "FC Barcelona",
            "La Liga",
            "Spain",
            "https://assets.socios.com/club-logos/bar-logo.png",
            22000000 // 22M tokens
        );
        console.log("BAR Token deployed to:", address(barToken));

        FanToken cityToken = new FanToken(
            "Manchester City Fan Token",
            "CITY",
            "Manchester City",
            "Premier League",
            "England",
            "https://assets.socios.com/club-logos/man-city-logo.png",
            18000000 // 18M tokens
        );
        console.log("CITY Token deployed to:", address(cityToken));

        FanToken juvToken = new FanToken(
            "Juventus Fan Token",
            "JUV",
            "Juventus",
            "Serie A",
            "Italy",
            "https://assets.socios.com/club-logos/juv-logo.png",
            20000000 // 20M tokens
        );
        console.log("JUV Token deployed to:", address(juvToken));

        FanToken bayToken = new FanToken(
            "Bayern Munich Fan Token",
            "BAY",
            "Bayern Munich",
            "Bundesliga",
            "Germany",
            "https://assets.socios.com/club-logos/bayern-logo.png",
            21000000 // 21M tokens
        );
        console.log("BAY Token deployed to:", address(bayToken));

        // 4. Ajouter les fan tokens au contrat de trading avec vos prix
        uint256 minTradeAmount = 1 ether; // 1 token minimum

        // PSG - 2 CHZ buy, 1.8 CHZ sell
        tradingContract.addFanToken(
            address(psgToken),
            "Paris Saint-Germain Fan Token",
            "PSG",
            2 ether, // 2 CHZ
            1.8 ether, // 1.8 CHZ
            minTradeAmount
        );

        // Real Madrid - 2.5 CHZ buy, 2.2 CHZ sell
        tradingContract.addFanToken(
            address(rmaToken),
            "Real Madrid Fan Token",
            "RMA",
            2.5 ether, // 2.5 CHZ
            2.2 ether, // 2.2 CHZ
            minTradeAmount
        );

        // Barcelona - 2.3 CHZ buy, 2.0 CHZ sell
        tradingContract.addFanToken(
            address(barToken),
            "FC Barcelona Fan Token",
            "BAR",
            2.3 ether, // 2.3 CHZ
            2.0 ether, // 2.0 CHZ
            minTradeAmount
        );

        // Manchester City - 2.1 CHZ buy, 1.9 CHZ sell
        tradingContract.addFanToken(
            address(cityToken),
            "Manchester City Fan Token",
            "CITY",
            2.1 ether, // 2.1 CHZ
            1.9 ether, // 1.9 CHZ
            minTradeAmount
        );

        // Juventus - 1.9 CHZ buy, 1.7 CHZ sell
        tradingContract.addFanToken(
            address(juvToken),
            "Juventus Fan Token",
            "JUV",
            1.9 ether, // 1.9 CHZ
            1.7 ether, // 1.7 CHZ
            minTradeAmount
        );

        // Bayern Munich - 2.4 CHZ buy, 2.1 CHZ sell
        tradingContract.addFanToken(
            address(bayToken),
            "Bayern Munich Fan Token",
            "BAY",
            2.4 ether, // 2.4 CHZ
            2.1 ether, // 2.1 CHZ
            minTradeAmount
        );

        // 5. Transférer des tokens au contrat de trading pour la liquidité
        uint256 liquidityAmount = 1000000 ether; // 1M tokens par équipe

        // D'abord, approuver le contrat de trading pour récupérer les tokens
        psgToken.approve(address(tradingContract), liquidityAmount);
        rmaToken.approve(address(tradingContract), liquidityAmount);
        barToken.approve(address(tradingContract), liquidityAmount);
        cityToken.approve(address(tradingContract), liquidityAmount);
        juvToken.approve(address(tradingContract), liquidityAmount);
        bayToken.approve(address(tradingContract), liquidityAmount);

        // 6. Ajouter la liquidité officielle (qui fera le transferFrom)
        tradingContract.addLiquidity(address(psgToken), liquidityAmount);
        tradingContract.addLiquidity(address(rmaToken), liquidityAmount);
        tradingContract.addLiquidity(address(barToken), liquidityAmount);
        tradingContract.addLiquidity(address(cityToken), liquidityAmount);
        tradingContract.addLiquidity(address(juvToken), liquidityAmount);
        tradingContract.addLiquidity(address(bayToken), liquidityAmount);

        // 7. Mint des CHZ pour les tests
        chzToken.mint(deployer, 10000000 ether); // 10M CHZ

        vm.stopBroadcast();

        // Afficher un résumé
        console.log("\n=== Deployment Summary ===");
        console.log("CHZ Token:", address(chzToken));
        console.log("Trading Contract:", address(tradingContract));
        console.log("PSG Token:", address(psgToken));
        console.log("RMA Token:", address(rmaToken));
        console.log("BAR Token:", address(barToken));
        console.log("CITY Token:", address(cityToken));
        console.log("JUV Token:", address(juvToken));
        console.log("BAY Token:", address(bayToken));
        console.log("\n=== Configuration for Frontend ===");
        console.log("Add these addresses to chilizConfig.ts:");
        console.log("CHZ_TOKEN: \"", address(chzToken), "\",");
        console.log("FAN_TOKEN_TRADING: \"", address(tradingContract), "\",");
        console.log("SUPPORTED_FAN_TOKENS: {");
        console.log("  \"PSG\": \"", address(psgToken), "\",");
        console.log("  \"RMA\": \"", address(rmaToken), "\",");
        console.log("  \"BAR\": \"", address(barToken), "\",");
        console.log("  \"CITY\": \"", address(cityToken), "\",");
        console.log("  \"JUV\": \"", address(juvToken), "\",");
        console.log("  \"BAY\": \"", address(bayToken), "\",");
        console.log("}");
    }
}
