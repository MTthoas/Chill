// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/FanToken.sol";

contract FanTokenCoverageTest is Test {
    FanToken public fanToken;
    address public owner;
    address public user1;
    address public user2;
    
    string constant TEAM_NAME = "Paris Saint-Germain";
    string constant TOKEN_NAME = "Paris Saint-Germain Fan Token";
    string constant SYMBOL = "PSG";
    string constant LEAGUE = "Ligue 1";
    string constant COUNTRY = "France";
    string constant LOGO_URI = "https://example.com/psg-logo.png";
    uint256 constant INITIAL_SUPPLY = 10_000_000; // 10M tokens
    
    event TeamInfoUpdated(string teamName, string league, string country);
    event LogoUpdated(string newLogoURI);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        fanToken = new FanToken(
            TOKEN_NAME,
            SYMBOL,
            TEAM_NAME,
            LEAGUE,
            COUNTRY,
            LOGO_URI,
            INITIAL_SUPPLY
        );
    }
    
    // Test du constructeur avec tous les événements
    function test_Constructor() public {
        // Créer un nouveau token pour tester les événements du constructeur
        vm.expectEmit(false, false, false, true);
        emit TeamInfoUpdated(TEAM_NAME, LEAGUE, COUNTRY);
        
        vm.expectEmit(false, false, false, true);
        emit LogoUpdated(LOGO_URI);
        
        FanToken newToken = new FanToken(
            TOKEN_NAME,
            SYMBOL,
            TEAM_NAME,
            LEAGUE,
            COUNTRY,
            LOGO_URI,
            INITIAL_SUPPLY
        );
        
        assertEq(newToken.name(), TOKEN_NAME);
        assertEq(newToken.symbol(), SYMBOL);
        assertEq(newToken.teamName(), TEAM_NAME);
        assertEq(newToken.league(), LEAGUE);
        assertEq(newToken.country(), COUNTRY);
        assertEq(newToken.logoURI(), LOGO_URI);
        assertEq(newToken.totalSupply(), INITIAL_SUPPLY * 10**18);
        assertEq(newToken.balanceOf(address(this)), INITIAL_SUPPLY * 10**18);
        assertEq(newToken.owner(), address(this));
        assertEq(newToken.MAX_SUPPLY(), 100_000_000 * 10**18);
    }
    
    // Test mint - succès avec événement
    function test_Mint_Success() public {
        uint256 mintAmount = 1000 * 10**18;
        uint256 initialBalance = fanToken.balanceOf(user1);
        uint256 initialSupply = fanToken.totalSupply();
        
        vm.expectEmit(true, false, false, true);
        emit TokensMinted(user1, mintAmount);
        
        fanToken.mint(user1, mintAmount);
        
        assertEq(fanToken.balanceOf(user1), initialBalance + mintAmount);
        assertEq(fanToken.totalSupply(), initialSupply + mintAmount);
    }
    
    // Test mint - zero address
    function test_Mint_ZeroAddress() public {
        vm.expectRevert("Cannot mint to zero address");
        fanToken.mint(address(0), 1000 * 10**18);
    }
    
    // Test mint - exceed max supply
    function test_Mint_ExceedMaxSupply() public {
        uint256 maxSupply = fanToken.MAX_SUPPLY();
        uint256 currentSupply = fanToken.totalSupply();
        uint256 excessAmount = maxSupply - currentSupply + 1;
        
        vm.expectRevert("Would exceed max supply");
        fanToken.mint(user1, excessAmount);
    }
    
    // Test mint - not owner
    function test_Mint_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        fanToken.mint(user1, 1000 * 10**18);
    }
    
    // Test burn - succès avec événement
    function test_Burn_Success() public {
        uint256 burnAmount = 1000 * 10**18;
        uint256 initialBalance = fanToken.balanceOf(owner);
        uint256 initialSupply = fanToken.totalSupply();
        
        vm.expectEmit(true, false, false, true);
        emit TokensBurned(owner, burnAmount);
        
        fanToken.burn(burnAmount);
        
        assertEq(fanToken.balanceOf(owner), initialBalance - burnAmount);
        assertEq(fanToken.totalSupply(), initialSupply - burnAmount);
    }
    
    // Test burn - insufficient balance
    function test_Burn_InsufficientBalance() public {
        uint256 balance = fanToken.balanceOf(owner);
        uint256 excessAmount = balance + 1;
        
        vm.expectRevert("Insufficient balance to burn");
        fanToken.burn(excessAmount);
    }
    
    // Test burn - not owner
    function test_Burn_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        fanToken.burn(1000 * 10**18);
    }
    
    // Test updateTeamInfo - succès avec événement
    function test_UpdateTeamInfo_Success() public {
        string memory newTeamName = "Real Madrid";
        string memory newLeague = "La Liga";
        string memory newCountry = "Spain";
        
        vm.expectEmit(false, false, false, true);
        emit TeamInfoUpdated(newTeamName, newLeague, newCountry);
        
        fanToken.updateTeamInfo(newTeamName, newLeague, newCountry);
        
        assertEq(fanToken.teamName(), newTeamName);
        assertEq(fanToken.league(), newLeague);
        assertEq(fanToken.country(), newCountry);
    }
    
    // Test updateTeamInfo - not owner
    function test_UpdateTeamInfo_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        fanToken.updateTeamInfo("New Team", "New League", "New Country");
    }
    
    // Test updateLogo - succès avec événement
    function test_UpdateLogo_Success() public {
        string memory newLogoURI = "https://example.com/new-logo.png";
        
        vm.expectEmit(false, false, false, true);
        emit LogoUpdated(newLogoURI);
        
        fanToken.updateLogo(newLogoURI);
        
        assertEq(fanToken.logoURI(), newLogoURI);
    }
    
    // Test updateLogo - not owner
    function test_UpdateLogo_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        fanToken.updateLogo("https://example.com/new-logo.png");
    }
    
    // Test pause - succès
    function test_Pause_Success() public {
        assertFalse(fanToken.paused());
        
        fanToken.pause();
        
        assertTrue(fanToken.paused());
    }
    
    // Test pause - not owner
    function test_Pause_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        fanToken.pause();
    }
    
    // Test unpause - succès
    function test_Unpause_Success() public {
        fanToken.pause();
        assertTrue(fanToken.paused());
        
        fanToken.unpause();
        
        assertFalse(fanToken.paused());
    }
    
    // Test unpause - not owner
    function test_Unpause_NotOwner() public {
        fanToken.pause();
        
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        fanToken.unpause();
    }
    
    // Test getTeamInfo - toutes les valeurs
    function test_GetTeamInfo() public view {
        (
            string memory _teamName,
            string memory _league,
            string memory _country,
            string memory _logoURI,
            uint256 _totalSupply,
            uint256 _maxSupply
        ) = fanToken.getTeamInfo();
        
        assertEq(_teamName, TEAM_NAME);
        assertEq(_league, LEAGUE);
        assertEq(_country, COUNTRY);
        assertEq(_logoURI, LOGO_URI);
        assertEq(_totalSupply, fanToken.totalSupply());
        assertEq(_maxSupply, fanToken.MAX_SUPPLY());
    }
    
    // Test transfer - normal
    function test_Transfer_Success() public {
        uint256 transferAmount = 1000 * 10**18;
        fanToken.transfer(user1, transferAmount);
        
        assertEq(fanToken.balanceOf(user1), transferAmount);
        assertEq(fanToken.balanceOf(owner), INITIAL_SUPPLY * 10**18 - transferAmount);
    }
    
    // Test transfer - when paused (doit échouer)
    function test_Transfer_WhenPaused() public {
        uint256 transferAmount = 1000 * 10**18;
        
        fanToken.pause();
        
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        fanToken.transfer(user1, transferAmount);
    }
    
    // Test approve et transferFrom - normal
    function test_ApproveAndTransferFrom_Success() public {
        uint256 transferAmount = 1000 * 10**18;
        
        // Approve user1 to spend owner's tokens
        fanToken.approve(user1, transferAmount);
        assertEq(fanToken.allowance(owner, user1), transferAmount);
        
        // user1 transfers from owner to user2
        vm.prank(user1);
        fanToken.transferFrom(owner, user2, transferAmount);
        
        assertEq(fanToken.balanceOf(user2), transferAmount);
        assertEq(fanToken.balanceOf(owner), INITIAL_SUPPLY * 10**18 - transferAmount);
        assertEq(fanToken.allowance(owner, user1), 0);
    }
    
    // Test transferFrom - when paused (doit échouer)
    function test_TransferFrom_WhenPaused() public {
        uint256 transferAmount = 1000 * 10**18;
        
        fanToken.approve(user1, transferAmount);
        fanToken.pause();
        
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        fanToken.transferFrom(owner, user2, transferAmount);
    }
    
    // Test _update function indirectement via mint quand pausé
    function test_Mint_WhenPaused() public {
        fanToken.pause();
        
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        fanToken.mint(user1, 1000 * 10**18);
    }
    
    // Test _update function indirectement via burn quand pausé
    function test_Burn_WhenPaused() public {
        fanToken.pause();
        
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        fanToken.burn(1000 * 10**18);
    }
    
    // Test des getters publics individuels
    function test_PublicGetters() public view {
        assertEq(fanToken.teamName(), TEAM_NAME);
        assertEq(fanToken.league(), LEAGUE);
        assertEq(fanToken.country(), COUNTRY);
        assertEq(fanToken.logoURI(), LOGO_URI);
        assertEq(fanToken.MAX_SUPPLY(), 100_000_000 * 10**18);
    }
    
    // Test edge case - mint exact max supply
    function test_Mint_ExactMaxSupply() public {
        uint256 maxSupply = fanToken.MAX_SUPPLY();
        uint256 currentSupply = fanToken.totalSupply();
        uint256 remainingSupply = maxSupply - currentSupply;
        
        fanToken.mint(user1, remainingSupply);
        
        assertEq(fanToken.totalSupply(), maxSupply);
    }
    
    // Test edge case - burn all balance
    function test_Burn_AllBalance() public {
        uint256 balance = fanToken.balanceOf(owner);
        
        fanToken.burn(balance);
        
        assertEq(fanToken.balanceOf(owner), 0);
        assertEq(fanToken.totalSupply(), 0);
    }
}
