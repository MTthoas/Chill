// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/ChilizFanTokenTrading.sol";
import "../src/MockCHZToken.sol";
import "../src/FanToken.sol";

contract ChilizFanTokenTradingCoverageTest is Test {
    ChilizFanTokenTrading public trading;
    MockCHZToken public chzToken;
    FanToken public psgToken;
    FanToken public barcelonaToken;
    
    address public owner;
    address public user1;
    address public user2;
    
    // Events
    event FanTokenAdded(address indexed tokenAddress, string name, uint256 buyPrice, uint256 sellPrice);
    event FanTokenUpdated(address indexed tokenAddress, uint256 newBuyPrice, uint256 newSellPrice);
    event TokensPurchased(address indexed buyer, address indexed tokenAddress, uint256 tokenAmount, uint256 chzPaid);
    event TokensSold(address indexed seller, address indexed tokenAddress, uint256 tokenAmount, uint256 chzReceived);
    event TradingFeeUpdated(uint256 newFee);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    event LiquidityAdded(address indexed tokenAddress, uint256 amount);
    event LiquidityRemoved(address indexed tokenAddress, uint256 amount);
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        // Déployer les contrats
        chzToken = new MockCHZToken();
        trading = new ChilizFanTokenTrading(address(chzToken));
        
        psgToken = new FanToken(
            "Paris Saint-Germain Fan Token",
            "PSG",
            "Paris Saint-Germain",
            "Ligue 1",
            "France",
            "https://example.com/psg-logo.png",
            20000000 // 20M tokens
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
        
        // Mint CHZ tokens pour les tests
        chzToken.mint(owner, 100000 * 10**18);
        chzToken.mint(user1, 10000 * 10**18);
        chzToken.mint(user2, 10000 * 10**18);
        chzToken.mint(address(trading), 50000 * 10**18);
    }
    
    // Test constructor avec zero address
    function test_Constructor_ZeroAddress() public {
        vm.expectRevert("Invalid CHZ token address");
        new ChilizFanTokenTrading(address(0));
    }
    
    // Test addFanToken - succès complet avec événement
    function test_AddFanToken_Success() public {
        vm.expectEmit(true, false, false, true);
        emit FanTokenAdded(
            address(psgToken),
            "Paris Saint-Germain Fan Token",
            2 * 10**18,
            18 * 10**17
        );
        
        trading.addFanToken(
            address(psgToken),
            "Paris Saint-Germain Fan Token",
            "PSG",
            2 * 10**18,    // 2 CHZ prix d'achat
            18 * 10**17,   // 1.8 CHZ prix de vente
            1 * 10**18     // 1 token minimum
        );
        
        // Vérifier que le token a été ajouté
        (
            address tokenAddress,
            string memory name,
            string memory symbol,
            uint256 buyPrice,
            uint256 sellPrice,
            bool isActive,
            uint256 minTradeAmount
        ) = trading.fanTokens(address(psgToken));
        
        assertEq(tokenAddress, address(psgToken));
        assertEq(name, "Paris Saint-Germain Fan Token");
        assertEq(symbol, "PSG");
        assertEq(buyPrice, 2 * 10**18);
        assertEq(sellPrice, 18 * 10**17);
        assertTrue(isActive);
        assertEq(minTradeAmount, 1 * 10**18);
        
        // Vérifier que le token est dans la liste
        address[] memory supportedTokens = trading.getSupportedTokens();
        assertEq(supportedTokens.length, 1);
        assertEq(supportedTokens[0], address(psgToken));
    }
    
    // Test addFanToken - zero address
    function test_AddFanToken_ZeroAddress() public {
        vm.expectRevert("Invalid token address");
        trading.addFanToken(
            address(0),
            "Test Token",
            "TEST",
            2 * 10**18,
            18 * 10**17,
            1 * 10**18
        );
    }
    
    // Test addFanToken - prix invalides
    function test_AddFanToken_InvalidPrices() public {
        vm.expectRevert("Prices must be greater than 0");
        trading.addFanToken(
            address(psgToken),
            "PSG Token",
            "PSG",
            0,  // Prix invalide
            18 * 10**17,
            1 * 10**18
        );
        
        vm.expectRevert("Prices must be greater than 0");
        trading.addFanToken(
            address(psgToken),
            "PSG Token",
            "PSG",
            2 * 10**18,
            0,  // Prix invalide
            1 * 10**18
        );
    }
    
    // Test addFanToken - buy price < sell price
    function test_AddFanToken_BuyPriceLowerThanSellPrice() public {
        vm.expectRevert("Buy price must be >= sell price");
        trading.addFanToken(
            address(psgToken),
            "PSG Token",
            "PSG",
            15 * 10**17,  // 1.5 CHZ
            2 * 10**18,   // 2 CHZ - plus élevé que le prix d'achat
            1 * 10**18
        );
    }
    
    // Test addFanToken - token déjà existant
    function test_AddFanToken_TokenAlreadyExists() public {
        // Ajouter le token une première fois
        trading.addFanToken(
            address(psgToken),
            "PSG Token",
            "PSG",
            2 * 10**18,
            18 * 10**17,
            1 * 10**18
        );
        
        // Essayer de l'ajouter à nouveau
        vm.expectRevert("Token already exists");
        trading.addFanToken(
            address(psgToken),
            "PSG Token 2",
            "PSG2",
            3 * 10**18,
            25 * 10**17,
            1 * 10**18
        );
    }
    
    // Test addFanToken - token ERC20 invalide
    function test_AddFanToken_InvalidERC20Token() public {
        // Créer une adresse qui n'est pas un contrat ERC20
        address fakeToken = makeAddr("fakeToken");
        
        vm.expectRevert();
        trading.addFanToken(
            fakeToken,
            "Fake Token",
            "FAKE",
            2 * 10**18,
            18 * 10**17,
            1 * 10**18
        );
    }
    
    // Test addFanToken - not owner
    function test_AddFanToken_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        trading.addFanToken(
            address(psgToken),
            "PSG Token",
            "PSG",
            2 * 10**18,
            18 * 10**17,
            1 * 10**18
        );
    }
    
    // Test updateTokenPrices - succès avec événement
    function test_UpdateTokenPrices_Success() public {
        // D'abord ajouter le token
        trading.addFanToken(
            address(psgToken),
            "PSG Token",
            "PSG",
            2 * 10**18,
            18 * 10**17,
            1 * 10**18
        );
        
        uint256 newBuyPrice = 25 * 10**17;  // 2.5 CHZ
        uint256 newSellPrice = 22 * 10**17; // 2.2 CHZ
        
        vm.expectEmit(true, false, false, true);
        emit FanTokenUpdated(address(psgToken), newBuyPrice, newSellPrice);
        
        trading.updateTokenPrices(address(psgToken), newBuyPrice, newSellPrice);
        
        (, , , uint256 buyPrice, uint256 sellPrice, ,) = trading.fanTokens(address(psgToken));
        assertEq(buyPrice, newBuyPrice);
        assertEq(sellPrice, newSellPrice);
    }
    
    // Test updateTokenPrices - token inexistant
    function test_UpdateTokenPrices_TokenDoesNotExist() public {
        vm.expectRevert("Token does not exist");
        trading.updateTokenPrices(address(psgToken), 2 * 10**18, 18 * 10**17);
    }
    
    // Test updateTokenPrices - prix invalides
    function test_UpdateTokenPrices_InvalidPrices() public {
        trading.addFanToken(
            address(psgToken),
            "PSG Token",
            "PSG",
            2 * 10**18,
            18 * 10**17,
            1 * 10**18
        );
        
        vm.expectRevert("Prices must be greater than 0");
        trading.updateTokenPrices(address(psgToken), 0, 18 * 10**17);
        
        vm.expectRevert("Buy price must be >= sell price");
        trading.updateTokenPrices(address(psgToken), 15 * 10**17, 2 * 10**18);
    }
    
    // Test updateTokenPrices - not owner
    function test_UpdateTokenPrices_NotOwner() public {
        trading.addFanToken(
            address(psgToken),
            "PSG Token",
            "PSG",
            2 * 10**18,
            18 * 10**17,
            1 * 10**18
        );
        
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        trading.updateTokenPrices(address(psgToken), 25 * 10**17, 22 * 10**17);
    }
    
    // Test setTokenActive - succès
    function test_SetTokenActive_Success() public {
        trading.addFanToken(
            address(psgToken),
            "PSG Token",
            "PSG",
            2 * 10**18,
            18 * 10**17,
            1 * 10**18
        );
        
        // Désactiver le token
        trading.setTokenActive(address(psgToken), false);
        (, , , , , bool isActive,) = trading.fanTokens(address(psgToken));
        assertFalse(isActive);
        
        // Réactiver le token
        trading.setTokenActive(address(psgToken), true);
        (, , , , , isActive,) = trading.fanTokens(address(psgToken));
        assertTrue(isActive);
    }
    
    // Test setTokenActive - token inexistant
    function test_SetTokenActive_TokenDoesNotExist() public {
        vm.expectRevert("Token does not exist");
        trading.setTokenActive(address(psgToken), false);
    }
    
    // Test setTokenActive - not owner
    function test_SetTokenActive_NotOwner() public {
        trading.addFanToken(
            address(psgToken),
            "PSG Token",
            "PSG",
            2 * 10**18,
            18 * 10**17,
            1 * 10**18
        );
        
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        trading.setTokenActive(address(psgToken), false);
    }
    
    // Configuration pour les tests d'achat/vente
    function _setupTokenForTrading() internal {
        // Ajouter le token au trading
        trading.addFanToken(
            address(psgToken),
            "PSG Token",
            "PSG",
            2 * 10**18,    // 2 CHZ prix d'achat
            18 * 10**17,   // 1.8 CHZ prix de vente
            1 * 10**18     // 1 token minimum
        );
        
        // Ajouter de la liquidité
        uint256 liquidityAmount = 1000000 * 10**18; // 1M tokens
        psgToken.approve(address(trading), liquidityAmount);
        trading.addLiquidity(address(psgToken), liquidityAmount);
    }
    
    // Test buyFanTokens - succès complet avec événement
    function test_BuyFanTokens_Success() public {
        _setupTokenForTrading();
        
        uint256 tokenAmount = 100 * 10**18; // 100 tokens
        uint256 totalCost = trading.getBuyPrice(address(psgToken), tokenAmount);
        
        vm.startPrank(user1);
        chzToken.approve(address(trading), totalCost);
        
        uint256 initialUserBalance = psgToken.balanceOf(user1);
        uint256 initialUserCHZ = chzToken.balanceOf(user1);
        uint256 initialReserves = trading.getTokenReserves(address(psgToken));
        
        vm.expectEmit(true, true, false, true);
        emit TokensPurchased(user1, address(psgToken), tokenAmount, totalCost);
        
        trading.buyFanTokens(address(psgToken), tokenAmount);
        
        assertEq(psgToken.balanceOf(user1), initialUserBalance + tokenAmount);
        assertEq(chzToken.balanceOf(user1), initialUserCHZ - totalCost);
        assertEq(trading.getTokenReserves(address(psgToken)), initialReserves - tokenAmount);
        
        vm.stopPrank();
    }
    
    // Test buyFanTokens - token inactif
    function test_BuyFanTokens_TokenNotActive() public {
        _setupTokenForTrading();
        trading.setTokenActive(address(psgToken), false);
        
        vm.prank(user1);
        vm.expectRevert("Token is not active");
        trading.buyFanTokens(address(psgToken), 100 * 10**18);
    }
    
    // Test buyFanTokens - montant zéro
    function test_BuyFanTokens_ZeroAmount() public {
        _setupTokenForTrading();
        
        vm.prank(user1);
        vm.expectRevert("Amount must be greater than 0");
        trading.buyFanTokens(address(psgToken), 0);
    }
    
    // Test buyFanTokens - montant en dessous du minimum
    function test_BuyFanTokens_BelowMinimum() public {
        _setupTokenForTrading();
        
        uint256 belowMinimum = 5 * 10**17; // 0.5 tokens (minimum est 1)
        
        vm.prank(user1);
        vm.expectRevert("Amount below minimum");
        trading.buyFanTokens(address(psgToken), belowMinimum);
    }
    
    // Test buyFanTokens - liquidité insuffisante
    function test_BuyFanTokens_InsufficientLiquidity() public {
        _setupTokenForTrading();
        
        uint256 excessiveAmount = 2000000 * 10**18; // Plus que la liquidité disponible
        
        vm.prank(user1);
        vm.expectRevert("Insufficient token liquidity");
        trading.buyFanTokens(address(psgToken), excessiveAmount);
    }
    
    // Test buyFanTokens - contrat pausé
    function test_BuyFanTokens_WhenPaused() public {
        _setupTokenForTrading();
        trading.pause();
        
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        trading.buyFanTokens(address(psgToken), 100 * 10**18);
    }
    
    // Test sellFanTokens - succès complet avec événement
    function test_SellFanTokens_Success() public {
        _setupTokenForTrading();
        
        // D'abord acheter des tokens
        uint256 buyAmount = 100 * 10**18;
        uint256 buyCost = trading.getBuyPrice(address(psgToken), buyAmount);
        
        vm.startPrank(user1);
        chzToken.approve(address(trading), buyCost);
        trading.buyFanTokens(address(psgToken), buyAmount);
        
        // Maintenant vendre une partie
        uint256 sellAmount = 50 * 10**18;
        uint256 expectedPayout = trading.getSellPrice(address(psgToken), sellAmount);
        
        psgToken.approve(address(trading), sellAmount);
        
        uint256 initialUserCHZ = chzToken.balanceOf(user1);
        uint256 initialUserTokens = psgToken.balanceOf(user1);
        uint256 initialReserves = trading.getTokenReserves(address(psgToken));
        
        vm.expectEmit(true, true, false, true);
        emit TokensSold(user1, address(psgToken), sellAmount, expectedPayout);
        
        trading.sellFanTokens(address(psgToken), sellAmount);
        
        assertEq(chzToken.balanceOf(user1), initialUserCHZ + expectedPayout);
        assertEq(psgToken.balanceOf(user1), initialUserTokens - sellAmount);
        assertEq(trading.getTokenReserves(address(psgToken)), initialReserves + sellAmount);
        
        vm.stopPrank();
    }
    
    // Test sellFanTokens - token inactif
    function test_SellFanTokens_TokenNotActive() public {
        _setupTokenForTrading();
        trading.setTokenActive(address(psgToken), false);
        
        vm.prank(user1);
        vm.expectRevert("Token is not active");
        trading.sellFanTokens(address(psgToken), 50 * 10**18);
    }
    
    // Test sellFanTokens - liquidité CHZ insuffisante
    function test_SellFanTokens_InsufficientCHZLiquidity() public {
        _setupTokenForTrading();
        
        // Retirer tout le CHZ du contrat
        uint256 contractBalance = chzToken.balanceOf(address(trading));
        trading.withdrawFunds(contractBalance);
        
        // Donner des tokens PSG à user1 directement
        psgToken.transfer(user1, 100 * 10**18);
        
        vm.startPrank(user1);
        psgToken.approve(address(trading), 50 * 10**18);
        
        vm.expectRevert("Insufficient CHZ liquidity");
        trading.sellFanTokens(address(psgToken), 50 * 10**18);
        
        vm.stopPrank();
    }
    
    // Test getBuyPrice et getSellPrice
    function test_GetPrices() public {
        _setupTokenForTrading();
        
        uint256 tokenAmount = 100 * 10**18;
        
        uint256 buyPrice = trading.getBuyPrice(address(psgToken), tokenAmount);
        uint256 sellPrice = trading.getSellPrice(address(psgToken), tokenAmount);
        
        // Prix d'achat = (100 * 2) + frais 1% = 202 CHZ
        uint256 expectedBuyPrice = (tokenAmount * 2 * 10**18) / 10**18; // 200 CHZ
        expectedBuyPrice = expectedBuyPrice + (expectedBuyPrice * 100) / 10000; // +1% = 202 CHZ
        
        // Prix de vente = (100 * 1.8) - frais 1% = 178.2 CHZ
        uint256 expectedSellPrice = (tokenAmount * 18 * 10**17) / 10**18; // 180 CHZ
        expectedSellPrice = expectedSellPrice - (expectedSellPrice * 100) / 10000; // -1% = 178.2 CHZ
        
        assertEq(buyPrice, expectedBuyPrice);
        assertEq(sellPrice, expectedSellPrice);
        assertTrue(buyPrice > sellPrice);
    }
    
    // Test getBuyPrice - token inexistant
    function test_GetBuyPrice_TokenDoesNotExist() public {
        vm.expectRevert("Token does not exist");
        trading.getBuyPrice(address(psgToken), 100 * 10**18);
    }
    
    // Test getSellPrice - token inexistant
    function test_GetSellPrice_TokenDoesNotExist() public {
        vm.expectRevert("Token does not exist");
        trading.getSellPrice(address(psgToken), 100 * 10**18);
    }
    
    // Test addLiquidity - succès avec événement
    function test_AddLiquidity_Success() public {
        trading.addFanToken(
            address(psgToken),
            "PSG Token",
            "PSG",
            2 * 10**18,
            18 * 10**17,
            1 * 10**18
        );
        
        uint256 liquidityAmount = 1000 * 10**18;
        psgToken.approve(address(trading), liquidityAmount);
        
        uint256 initialReserves = trading.getTokenReserves(address(psgToken));
        
        vm.expectEmit(true, false, false, true);
        emit LiquidityAdded(address(psgToken), liquidityAmount);
        
        trading.addLiquidity(address(psgToken), liquidityAmount);
        
        assertEq(trading.getTokenReserves(address(psgToken)), initialReserves + liquidityAmount);
    }
    
    // Test addLiquidity - token inexistant
    function test_AddLiquidity_TokenDoesNotExist() public {
        vm.expectRevert("Token does not exist");
        trading.addLiquidity(address(psgToken), 1000 * 10**18);
    }
    
    // Test addLiquidity - montant zéro
    function test_AddLiquidity_ZeroAmount() public {
        trading.addFanToken(
            address(psgToken),
            "PSG Token",
            "PSG",
            2 * 10**18,
            18 * 10**17,
            1 * 10**18
        );
        
        vm.expectRevert("Amount must be greater than 0");
        trading.addLiquidity(address(psgToken), 0);
    }
    
    // Test addLiquidity - not owner
    function test_AddLiquidity_NotOwner() public {
        trading.addFanToken(
            address(psgToken),
            "PSG Token",
            "PSG",
            2 * 10**18,
            18 * 10**17,
            1 * 10**18
        );
        
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        trading.addLiquidity(address(psgToken), 1000 * 10**18);
    }
    
    // Test removeLiquidity - succès avec événement
    function test_RemoveLiquidity_Success() public {
        _setupTokenForTrading();
        
        uint256 removeAmount = 100 * 10**18;
        uint256 initialReserves = trading.getTokenReserves(address(psgToken));
        uint256 initialOwnerBalance = psgToken.balanceOf(owner);
        
        vm.expectEmit(true, false, false, true);
        emit LiquidityRemoved(address(psgToken), removeAmount);
        
        trading.removeLiquidity(address(psgToken), removeAmount);
        
        assertEq(trading.getTokenReserves(address(psgToken)), initialReserves - removeAmount);
        assertEq(psgToken.balanceOf(owner), initialOwnerBalance + removeAmount);
    }
    
    // Test removeLiquidity - réserves insuffisantes
    function test_RemoveLiquidity_InsufficientReserves() public {
        _setupTokenForTrading();
        
        uint256 reserves = trading.getTokenReserves(address(psgToken));
        uint256 excessiveAmount = reserves + 1;
        
        vm.expectRevert("Insufficient reserves");
        trading.removeLiquidity(address(psgToken), excessiveAmount);
    }
    
    // Test setTradingFee - succès avec événement
    function test_SetTradingFee_Success() public {
        uint256 newFee = 200; // 2%
        
        vm.expectEmit(false, false, false, true);
        emit TradingFeeUpdated(newFee);
        
        trading.setTradingFee(newFee);
        
        assertEq(trading.tradingFee(), newFee);
    }
    
    // Test setTradingFee - frais trop élevés
    function test_SetTradingFee_FeeTooHigh() public {
        vm.expectRevert("Fee cannot exceed 10%");
        trading.setTradingFee(1001); // > 10%
    }
    
    // Test setTradingFee - not owner
    function test_SetTradingFee_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        trading.setTradingFee(200);
    }
    
    // Test withdrawFunds - succès avec événement
    function test_WithdrawFunds_Success() public {
        uint256 withdrawAmount = 1000 * 10**18;
        uint256 initialOwnerBalance = chzToken.balanceOf(owner);
        uint256 initialContractBalance = chzToken.balanceOf(address(trading));
        
        vm.expectEmit(true, false, false, true);
        emit FundsWithdrawn(owner, withdrawAmount);
        
        trading.withdrawFunds(withdrawAmount);
        
        assertEq(chzToken.balanceOf(owner), initialOwnerBalance + withdrawAmount);
        assertEq(chzToken.balanceOf(address(trading)), initialContractBalance - withdrawAmount);
    }
    
    // Test withdrawFunds - montant insuffisant
    function test_WithdrawFunds_InsufficientBalance() public {
        uint256 contractBalance = chzToken.balanceOf(address(trading));
        uint256 excessiveAmount = contractBalance + 1;
        
        vm.expectRevert("Insufficient contract balance");
        trading.withdrawFunds(excessiveAmount);
    }
    
    // Test pause/unpause
    function test_PauseUnpause() public {
        assertFalse(trading.paused());
        
        trading.pause();
        assertTrue(trading.paused());
        
        trading.unpause();
        assertFalse(trading.paused());
    }
    
    // Test pause - not owner
    function test_Pause_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        trading.pause();
    }
    
    // Test emergencyWithdraw - avec solde
    function test_EmergencyWithdraw_WithBalance() public {
        uint256 contractBalance = chzToken.balanceOf(address(trading));
        uint256 initialOwnerBalance = chzToken.balanceOf(owner);
        
        trading.emergencyWithdraw();
        
        assertEq(chzToken.balanceOf(address(trading)), 0);
        assertEq(chzToken.balanceOf(owner), initialOwnerBalance + contractBalance);
    }
    
    // Test emergencyWithdraw - sans solde
    function test_EmergencyWithdraw_NoBalance() public {
        // Retirer tout d'abord
        uint256 contractBalance = chzToken.balanceOf(address(trading));
        trading.withdrawFunds(contractBalance);
        
        // EmergencyWithdraw ne devrait rien faire
        trading.emergencyWithdraw();
        
        assertEq(chzToken.balanceOf(address(trading)), 0);
    }
    
    // Test getters
    function test_Getters() public view {
        assertEq(address(trading.chzToken()), address(chzToken));
        assertEq(trading.tradingFee(), 100); // 1% par défaut
        assertEq(trading.owner(), owner);
    }
    
    // Test getFanTokenInfo
    function test_GetFanTokenInfo() public {
        trading.addFanToken(
            address(psgToken),
            "PSG Token",
            "PSG",
            2 * 10**18,
            18 * 10**17,
            1 * 10**18
        );
        
        ChilizFanTokenTrading.FanTokenInfo memory info = trading.getFanTokenInfo(address(psgToken));
        
        assertEq(info.tokenAddress, address(psgToken));
        assertEq(info.name, "PSG Token");
        assertEq(info.symbol, "PSG");
        assertEq(info.buyPrice, 2 * 10**18);
        assertEq(info.sellPrice, 18 * 10**17);
        assertTrue(info.isActive);
        assertEq(info.minTradeAmount, 1 * 10**18);
    }
    
    // Test getTokenReserves
    function test_GetTokenReserves() public {
        _setupTokenForTrading();
        
        uint256 reserves = trading.getTokenReserves(address(psgToken));
        assertEq(reserves, 1000000 * 10**18); // Liquidité ajoutée dans _setupTokenForTrading
    }
}
