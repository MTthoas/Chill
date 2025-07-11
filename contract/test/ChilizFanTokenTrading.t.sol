// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/ChilizFanTokenTrading.sol";
import "../src/MockCHZToken.sol";
import "../src/FanToken.sol";

contract ChilizFanTokenTradingTest is Test {
    ChilizFanTokenTrading public trading;
    MockCHZToken public chzToken;
    FanToken public barcelonaToken;
    FanToken public psgToken;
    
    address public owner;
    address public user1;
    address public user2;
    
    uint256 constant ONE_CHZ = 1 ether;
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        // Déployer les contrats
        chzToken = new MockCHZToken();
        trading = new ChilizFanTokenTrading(address(chzToken));
        barcelonaToken = new FanToken(
            "FC Barcelona Fan Token",
            "BAR", 
            "FC Barcelona",
            "La Liga",
            "Spain",
            "https://example.com/barcelona-logo.png",
            22000000 // 22M tokens
        );
        psgToken = new FanToken(
            "Paris Saint-Germain Fan Token",
            "PSG",
            "Paris Saint-Germain",
            "Ligue 1", 
            "France",
            "https://example.com/psg-logo.png",
            20000000 // 20M tokens
        );
        
        // Ajouter les tokens au trading
        trading.addFanToken(
            address(barcelonaToken),
            "FC Barcelona Fan Token",
            "BAR",
            2 * ONE_CHZ,        // Prix d'achat: 2 CHZ
            18 * ONE_CHZ / 10,  // Prix de vente: 1.8 CHZ
            ONE_CHZ / 10        // Minimum trade: 0.1 token
        );
        
        trading.addFanToken(
            address(psgToken),
            "Paris Saint-Germain Fan Token", 
            "PSG",
            25 * ONE_CHZ / 10,  // Prix d'achat: 2.5 CHZ
            22 * ONE_CHZ / 10,  // Prix de vente: 2.2 CHZ
            ONE_CHZ / 10        // Minimum trade: 0.1 token
        );
        
        // Ajouter de la liquidité
        uint256 liquidityAmount = 1000 * 10**18;
        
        // Approuver et ajouter directement la liquidité (le contrat récupèrera les tokens)
        barcelonaToken.approve(address(trading), liquidityAmount);
        trading.addLiquidity(address(barcelonaToken), liquidityAmount);
        
        psgToken.approve(address(trading), liquidityAmount);
        trading.addLiquidity(address(psgToken), liquidityAmount);
        
        // Donner des CHZ aux utilisateurs pour les tests
        chzToken.mint(user1, 1000 * ONE_CHZ);
        chzToken.mint(user2, 1000 * ONE_CHZ);
    }
    
    function testAddFanToken() public view {
        address[] memory supportedTokens = trading.getSupportedTokens();
        assertEq(supportedTokens.length, 2);
        assertEq(supportedTokens[0], address(barcelonaToken));
        assertEq(supportedTokens[1], address(psgToken));
    }
    
    function testBuyFanTokens() public {
        vm.startPrank(user1);
        
        // Approuver les CHZ pour le trading
        uint256 buyAmount = 5 * 10**18; // 5 BAR tokens
        uint256 expectedCost = trading.getBuyPrice(address(barcelonaToken), buyAmount);
        
        chzToken.approve(address(trading), expectedCost);
        
        uint256 initialChzBalance = chzToken.balanceOf(user1);
        uint256 initialBarBalance = barcelonaToken.balanceOf(user1);
        
        // Acheter des tokens
        trading.buyFanTokens(address(barcelonaToken), buyAmount);
        
        // Vérifier les balances
        assertEq(barcelonaToken.balanceOf(user1), initialBarBalance + buyAmount);
        assertEq(chzToken.balanceOf(user1), initialChzBalance - expectedCost);
        
        vm.stopPrank();
    }
    
    function testSellFanTokens() public {
        // D'abord acheter des tokens
        vm.startPrank(user1);
        uint256 buyAmount = 5 * 10**18; // 5 BAR tokens
        uint256 buyPrice = trading.getBuyPrice(address(barcelonaToken), buyAmount);
        
        chzToken.approve(address(trading), buyPrice);
        trading.buyFanTokens(address(barcelonaToken), buyAmount);
        
        // Maintenant vendre
        uint256 sellAmount = 3 * 10**18; // 3 BAR tokens
        uint256 expectedPayout = trading.getSellPrice(address(barcelonaToken), sellAmount);
        
        barcelonaToken.approve(address(trading), sellAmount);
        
        uint256 initialChzBalance = chzToken.balanceOf(user1);
        uint256 initialBarBalance = barcelonaToken.balanceOf(user1);
        
        trading.sellFanTokens(address(barcelonaToken), sellAmount);
        
        // Vérifier les balances
        assertEq(barcelonaToken.balanceOf(user1), initialBarBalance - sellAmount);
        assertEq(chzToken.balanceOf(user1), initialChzBalance + expectedPayout);
        
        vm.stopPrank();
    }
    
    function testPriceCalculation() public view {
        uint256 amount = 10 * 10**18; // 10 tokens
        
        // Prix d'achat (avec frais de 1%)
        uint256 buyPrice = trading.getBuyPrice(address(barcelonaToken), amount);
        uint256 expectedBuyPrice = ((amount * 2 * ONE_CHZ) / 10**18 * 101) / 100; // 2 CHZ * 10 tokens * 1.01
        assertEq(buyPrice, expectedBuyPrice);
        
        // Prix de vente (avec frais de 1%)
        uint256 sellPrice = trading.getSellPrice(address(barcelonaToken), amount);
        uint256 expectedSellPrice = ((amount * 18 * ONE_CHZ) / (10 * 10**18) * 99) / 100; // 1.8 CHZ * 10 tokens * 0.99
        assertEq(sellPrice, expectedSellPrice);
    }
    
    function testInsufficientLiquidity() public {
        vm.startPrank(user1);
        
        uint256 buyAmount = 2000 * 10**18; // Plus que la liquidité disponible
        uint256 buyPrice = trading.getBuyPrice(address(barcelonaToken), buyAmount);
        
        chzToken.approve(address(trading), buyPrice);
        
        vm.expectRevert("Insufficient token liquidity");
        trading.buyFanTokens(address(barcelonaToken), buyAmount);
        
        vm.stopPrank();
    }
    
    function testMinimumTradeAmount() public {
        vm.startPrank(user1);
        
        uint256 tooSmallAmount = ONE_CHZ / 20; // 0.05 tokens (moins que le minimum de 0.1)
        uint256 buyPrice = trading.getBuyPrice(address(barcelonaToken), tooSmallAmount);
        
        chzToken.approve(address(trading), buyPrice);
        
        vm.expectRevert("Amount below minimum");
        trading.buyFanTokens(address(barcelonaToken), tooSmallAmount);
        
        vm.stopPrank();
    }
    
    function testOnlyOwnerFunctions() public {
        vm.startPrank(user1);
        
        vm.expectRevert();
        trading.addFanToken(address(0x123), "Test", "TST", ONE_CHZ, ONE_CHZ, ONE_CHZ);
        
        vm.expectRevert();
        trading.updateTokenPrices(address(barcelonaToken), ONE_CHZ, ONE_CHZ);
        
        vm.expectRevert();
        trading.setTradingFee(200);
        
        vm.stopPrank();
    }
}
