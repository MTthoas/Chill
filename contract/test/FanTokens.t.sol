// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/FanToken.sol";
import "../src/MockCHZToken.sol";
import "../src/ChilizFanTokenTrading.sol";

contract FanTokensTest is Test {
    FanToken public psgToken;
    FanToken public realMadridToken;
    FanToken public barcelonaToken;
    MockCHZToken public chzToken;
    ChilizFanTokenTrading public trading;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Déployer CHZ token
        chzToken = new MockCHZToken();
        
        // Déployer le contrat de trading
        trading = new ChilizFanTokenTrading(address(chzToken));
        
        // Déployer les fan tokens
        psgToken = new FanToken(
            "Paris Saint-Germain Fan Token",
            "PSG",
            "Paris Saint-Germain",
            "Ligue 1",
            "France",
            "https://example.com/psg-logo.png",
            20000000 // 20M tokens
        );
        
        realMadridToken = new FanToken(
            "Real Madrid Fan Token",
            "RMA",
            "Real Madrid",
            "La Liga",
            "Spain",
            "https://example.com/real-madrid-logo.png",
            25000000 // 25M tokens
        );
        
        barcelonaToken = new FanToken(
            "FC Barcelona Fan Token",
            "BAR",
            "FC Barcelona",
            "La Liga",
            "Spain",
            "https://example.com/barcelona-logo.png",
            22000000 // 22M tokens
        );
        
        // Ajouter les tokens au trading
        trading.addFanToken(
            address(psgToken),
            "Paris Saint-Germain Fan Token",
            "PSG",
            2 * 10**18,    // 2 CHZ prix d'achat
            18 * 10**17,   // 1.8 CHZ prix de vente
            1 * 10**18     // 1 token minimum
        );
        
        trading.addFanToken(
            address(realMadridToken),
            "Real Madrid Fan Token",
            "RMA",
            25 * 10**17,   // 2.5 CHZ prix d'achat
            22 * 10**17,   // 2.2 CHZ prix de vente
            1 * 10**18     // 1 token minimum
        );
        
        trading.addFanToken(
            address(barcelonaToken),
            "FC Barcelona Fan Token",
            "BAR",
            23 * 10**17,   // 2.3 CHZ prix d'achat
            20 * 10**17,   // 2.0 CHZ prix de vente
            1 * 10**18     // 1 token minimum
        );
        
        // Ajouter de la liquidité - d'abord approuver puis ajouter
        uint256 liquidityAmount = 10000000 * 10**18; // 10M tokens par équipe
        
        // PSG
        psgToken.approve(address(trading), liquidityAmount);
        trading.addLiquidity(address(psgToken), liquidityAmount);
        
        // Real Madrid  
        realMadridToken.approve(address(trading), liquidityAmount);
        trading.addLiquidity(address(realMadridToken), liquidityAmount);
        
        // Barcelona
        barcelonaToken.approve(address(trading), liquidityAmount);
        trading.addLiquidity(address(barcelonaToken), liquidityAmount);
        
        // Mint CHZ pour les tests
        chzToken.mint(user1, 10000 * 10**18);
        chzToken.mint(user2, 10000 * 10**18);
        chzToken.mint(address(trading), 50000 * 10**18);
        
        vm.stopPrank();
    }
    
    function testFanTokenDeployment() public view {
        // Test PSG token
        assertEq(psgToken.name(), "Paris Saint-Germain Fan Token");
        assertEq(psgToken.symbol(), "PSG");
        assertEq(psgToken.teamName(), "Paris Saint-Germain");
        assertEq(psgToken.league(), "Ligue 1");
        assertEq(psgToken.country(), "France");
        assertEq(psgToken.totalSupply(), 20000000 * 10**18);
        
        // Test Real Madrid token
        assertEq(realMadridToken.symbol(), "RMA");
        assertEq(realMadridToken.teamName(), "Real Madrid");
        assertEq(realMadridToken.league(), "La Liga");
        
        // Test Barcelona token
        assertEq(barcelonaToken.symbol(), "BAR");
        assertEq(barcelonaToken.teamName(), "FC Barcelona");
    }
    
    function testBuyPSGTokens() public {
        vm.startPrank(user1);
        
        uint256 tokenAmount = 100 * 10**18; // 100 PSG tokens
        uint256 expectedCost = trading.getBuyPrice(address(psgToken), tokenAmount);
        
        // Approuver CHZ
        chzToken.approve(address(trading), expectedCost);
        
        uint256 initialBalance = psgToken.balanceOf(user1);
        uint256 initialCHZ = chzToken.balanceOf(user1);
        
        // Acheter des tokens PSG
        trading.buyFanTokens(address(psgToken), tokenAmount);
        
        // Vérifier les balances
        assertEq(psgToken.balanceOf(user1), initialBalance + tokenAmount);
        assertEq(chzToken.balanceOf(user1), initialCHZ - expectedCost);
        
        vm.stopPrank();
    }
    
    function testSellRealMadridTokens() public {
        // D'abord acheter des tokens Real Madrid
        vm.startPrank(user1);
        
        uint256 tokenAmount = 50 * 10**18; // 50 RMA tokens
        uint256 buyCost = trading.getBuyPrice(address(realMadridToken), tokenAmount);
        
        chzToken.approve(address(trading), buyCost);
        trading.buyFanTokens(address(realMadridToken), tokenAmount);
        
        // Maintenant vendre une partie
        uint256 sellAmount = 25 * 10**18; // 25 RMA tokens
        uint256 expectedPayout = trading.getSellPrice(address(realMadridToken), sellAmount);
        
        realMadridToken.approve(address(trading), sellAmount);
        
        uint256 initialCHZ = chzToken.balanceOf(user1);
        
        trading.sellFanTokens(address(realMadridToken), sellAmount);
        
        // Vérifier les balances
        assertEq(realMadridToken.balanceOf(user1), tokenAmount - sellAmount);
        assertEq(chzToken.balanceOf(user1), initialCHZ + expectedPayout);
        
        vm.stopPrank();
    }
    
    function testMultipleTeamTrading() public {
        vm.startPrank(user2);
        
        // Acheter PSG
        uint256 psgAmount = 75 * 10**18;
        uint256 psgCost = trading.getBuyPrice(address(psgToken), psgAmount);
        chzToken.approve(address(trading), psgCost);
        trading.buyFanTokens(address(psgToken), psgAmount);
        
        // Acheter Barcelona
        uint256 barAmount = 60 * 10**18;
        uint256 barCost = trading.getBuyPrice(address(barcelonaToken), barAmount);
        chzToken.approve(address(trading), barCost);
        trading.buyFanTokens(address(barcelonaToken), barAmount);
        
        // Vérifier les balances
        assertEq(psgToken.balanceOf(user2), psgAmount);
        assertEq(barcelonaToken.balanceOf(user2), barAmount);
        
        vm.stopPrank();
    }
    
    function testFanTokenMinting() public {
        vm.startPrank(owner);
        
        uint256 initialSupply = psgToken.totalSupply();
        uint256 mintAmount = 1000000 * 10**18; // 1M tokens
        
        psgToken.mint(user1, mintAmount);
        
        assertEq(psgToken.totalSupply(), initialSupply + mintAmount);
        assertEq(psgToken.balanceOf(user1), mintAmount);
        
        vm.stopPrank();
    }
    
    function testFanTokenBurning() public {
        vm.startPrank(owner);
        
        uint256 initialSupply = barcelonaToken.totalSupply();
        uint256 burnAmount = 500000 * 10**18; // 500k tokens
        
        barcelonaToken.burn(burnAmount);
        
        assertEq(barcelonaToken.totalSupply(), initialSupply - burnAmount);
        
        vm.stopPrank();
    }
    
    function testPriceCalculations() public view {
        // Test prix PSG
        uint256 psgBuyPrice = trading.getBuyPrice(address(psgToken), 10 * 10**18);
        uint256 psgSellPrice = trading.getSellPrice(address(psgToken), 10 * 10**18);
        
        assertGt(psgBuyPrice, psgSellPrice); // Prix d'achat > prix de vente
        
        // Test prix Real Madrid
        uint256 rmaBuyPrice = trading.getBuyPrice(address(realMadridToken), 10 * 10**18);
        uint256 rmaSellPrice = trading.getSellPrice(address(realMadridToken), 10 * 10**18);
        
        assertGt(rmaBuyPrice, rmaSellPrice);
        assertGt(rmaBuyPrice, psgBuyPrice); // RMA plus cher que PSG
    }
    
    function testTeamInfoFunction() public view {
        (
            string memory teamName,
            string memory league,
            string memory country,
            ,  // logoURI - pas utilisé
            uint256 totalSupply,
            uint256 maxSupply
        ) = psgToken.getTeamInfo();
        
        assertEq(teamName, "Paris Saint-Germain");
        assertEq(league, "Ligue 1");
        assertEq(country, "France");
        assertEq(totalSupply, 20000000 * 10**18);
        assertEq(maxSupply, 100000000 * 10**18);
    }
}
