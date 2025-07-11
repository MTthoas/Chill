// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ChilizFanTokenTrading
 * @dev Contrat pour l'achat et la vente de fan tokens Chiliz existants
 */
contract ChilizFanTokenTrading is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Token CHZ principal
    IERC20 public immutable chzToken;
    
    // Structure pour représenter un fan token existant
    struct FanTokenInfo {
        address tokenAddress;
        string name;
        string symbol;
        uint256 buyPrice;  // Prix d'achat en CHZ (wei)
        uint256 sellPrice; // Prix de vente en CHZ (wei)
        bool isActive;
        uint256 minTradeAmount; // Montant minimum de trading
    }
    
    // Mapping des fan tokens supportés
    mapping(address => FanTokenInfo) public fanTokens;
    address[] public supportedTokens;
    
    // Réserves du contrat pour chaque token
    mapping(address => uint256) public tokenReserves;
    
    // Frais de trading (en points de base, 100 = 1%)
    uint256 public tradingFee = 100; // 1% par défaut
    
    // Events
    event FanTokenAdded(address indexed tokenAddress, string name, uint256 buyPrice, uint256 sellPrice);
    event FanTokenUpdated(address indexed tokenAddress, uint256 newBuyPrice, uint256 newSellPrice);
    event TokensPurchased(address indexed buyer, address indexed tokenAddress, uint256 tokenAmount, uint256 chzPaid);
    event TokensSold(address indexed seller, address indexed tokenAddress, uint256 tokenAmount, uint256 chzReceived);
    event TradingFeeUpdated(uint256 newFee);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    event LiquidityAdded(address indexed tokenAddress, uint256 amount);
    event LiquidityRemoved(address indexed tokenAddress, uint256 amount);
    
    constructor(address _chzToken) Ownable(msg.sender) {
        require(_chzToken != address(0), "Invalid CHZ token address");
        chzToken = IERC20(_chzToken);
    }
    
    /**
     * @dev Ajouter un nouveau fan token existant à la plateforme
     */
    function addFanToken(
        address _tokenAddress,
        string memory _name,
        string memory _symbol,
        uint256 _buyPrice,
        uint256 _sellPrice,
        uint256 _minTradeAmount
    ) external onlyOwner {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_buyPrice > 0 && _sellPrice > 0, "Prices must be greater than 0");
        require(_buyPrice >= _sellPrice, "Buy price must be >= sell price");
        require(fanTokens[_tokenAddress].tokenAddress == address(0), "Token already exists");
        
        // Vérifier que le token existe (ERC20)
        IERC20 token = IERC20(_tokenAddress);
        require(token.totalSupply() > 0, "Invalid ERC20 token");
        
        fanTokens[_tokenAddress] = FanTokenInfo({
            tokenAddress: _tokenAddress,
            name: _name,
            symbol: _symbol,
            buyPrice: _buyPrice,
            sellPrice: _sellPrice,
            isActive: true,
            minTradeAmount: _minTradeAmount
        });
        
        supportedTokens.push(_tokenAddress);
        
        emit FanTokenAdded(_tokenAddress, _name, _buyPrice, _sellPrice);
    }
    
    /**
     * @dev Mettre à jour les prix d'un fan token
     */
    function updateTokenPrices(address _tokenAddress, uint256 _newBuyPrice, uint256 _newSellPrice) external onlyOwner {
        require(fanTokens[_tokenAddress].tokenAddress != address(0), "Token does not exist");
        require(_newBuyPrice > 0 && _newSellPrice > 0, "Prices must be greater than 0");
        require(_newBuyPrice >= _newSellPrice, "Buy price must be >= sell price");
        
        fanTokens[_tokenAddress].buyPrice = _newBuyPrice;
        fanTokens[_tokenAddress].sellPrice = _newSellPrice;
        
        emit FanTokenUpdated(_tokenAddress, _newBuyPrice, _newSellPrice);
    }
    
    /**
     * @dev Activer/désactiver un fan token
     */
    function setTokenActive(address _tokenAddress, bool _isActive) external onlyOwner {
        require(fanTokens[_tokenAddress].tokenAddress != address(0), "Token does not exist");
        fanTokens[_tokenAddress].isActive = _isActive;
    }
    
    /**
     * @dev Acheter des fan tokens avec CHZ
     */
    function buyFanTokens(address _tokenAddress, uint256 _tokenAmount) external nonReentrant whenNotPaused {
        require(fanTokens[_tokenAddress].isActive, "Token is not active");
        require(_tokenAmount > 0, "Amount must be greater than 0");
        require(_tokenAmount >= fanTokens[_tokenAddress].minTradeAmount, "Amount below minimum");
        require(tokenReserves[_tokenAddress] >= _tokenAmount, "Insufficient token liquidity");
        
        uint256 totalCost = (_tokenAmount * fanTokens[_tokenAddress].buyPrice) / 10**18;
        uint256 fee = (totalCost * tradingFee) / 10000;
        uint256 totalPayment = totalCost + fee;
        
        // Transférer CHZ du buyer vers le contrat
        chzToken.safeTransferFrom(msg.sender, address(this), totalPayment);
        
        // Transférer les fan tokens au buyer
        IERC20(_tokenAddress).safeTransfer(msg.sender, _tokenAmount);
        
        // Mettre à jour les réserves
        tokenReserves[_tokenAddress] -= _tokenAmount;
        
        emit TokensPurchased(msg.sender, _tokenAddress, _tokenAmount, totalPayment);
    }
    
    /**
     * @dev Vendre des fan tokens contre CHZ
     */
    function sellFanTokens(address _tokenAddress, uint256 _tokenAmount) external nonReentrant whenNotPaused {
        require(fanTokens[_tokenAddress].isActive, "Token is not active");
        require(_tokenAmount > 0, "Amount must be greater than 0");
        require(_tokenAmount >= fanTokens[_tokenAddress].minTradeAmount, "Amount below minimum");
        
        uint256 totalValue = (_tokenAmount * fanTokens[_tokenAddress].sellPrice) / 10**18;
        uint256 fee = (totalValue * tradingFee) / 10000;
        uint256 payout = totalValue - fee;
        
        require(chzToken.balanceOf(address(this)) >= payout, "Insufficient CHZ liquidity");
        
        // Transférer les fan tokens du vendeur vers le contrat
        IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _tokenAmount);
        
        // Transférer CHZ au vendeur
        chzToken.safeTransfer(msg.sender, payout);
        
        // Mettre à jour les réserves
        tokenReserves[_tokenAddress] += _tokenAmount;
        
        emit TokensSold(msg.sender, _tokenAddress, _tokenAmount, payout);
    }
    
    /**
     * @dev Obtenir le prix d'achat pour une quantité donnée (incluant les frais)
     */
    function getBuyPrice(address _tokenAddress, uint256 _tokenAmount) external view returns (uint256) {
        require(fanTokens[_tokenAddress].tokenAddress != address(0), "Token does not exist");
        
        uint256 totalCost = (_tokenAmount * fanTokens[_tokenAddress].buyPrice) / 10**18;
        uint256 fee = (totalCost * tradingFee) / 10000;
        return totalCost + fee;
    }
    
    /**
     * @dev Obtenir le prix de vente pour une quantité donnée (après frais)
     */
    function getSellPrice(address _tokenAddress, uint256 _tokenAmount) external view returns (uint256) {
        require(fanTokens[_tokenAddress].tokenAddress != address(0), "Token does not exist");
        
        uint256 totalValue = (_tokenAmount * fanTokens[_tokenAddress].sellPrice) / 10**18;
        uint256 fee = (totalValue * tradingFee) / 10000;
        return totalValue - fee;
    }
    
    /**
     * @dev Obtenir les réserves disponibles pour un token
     */
    function getTokenReserves(address _tokenAddress) external view returns (uint256) {
        return tokenReserves[_tokenAddress];
    }
    
    /**
     * @dev Obtenir tous les tokens supportés
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }
    
    /**
     * @dev Obtenir les informations d'un fan token
     */
    function getFanTokenInfo(address _tokenAddress) external view returns (FanTokenInfo memory) {
        return fanTokens[_tokenAddress];
    }
    
    /**
     * @dev Ajouter de la liquidité pour un token (seulement le propriétaire)
     */
    function addLiquidity(address _tokenAddress, uint256 _amount) external onlyOwner {
        require(fanTokens[_tokenAddress].tokenAddress != address(0), "Token does not exist");
        require(_amount > 0, "Amount must be greater than 0");
        
        IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _amount);
        tokenReserves[_tokenAddress] += _amount;
        
        emit LiquidityAdded(_tokenAddress, _amount);
    }
    
    /**
     * @dev Retirer de la liquidité pour un token (seulement le propriétaire)
     */
    function removeLiquidity(address _tokenAddress, uint256 _amount) external onlyOwner {
        require(fanTokens[_tokenAddress].tokenAddress != address(0), "Token does not exist");
        require(_amount > 0, "Amount must be greater than 0");
        require(tokenReserves[_tokenAddress] >= _amount, "Insufficient reserves");
        
        IERC20(_tokenAddress).safeTransfer(msg.sender, _amount);
        tokenReserves[_tokenAddress] -= _amount;
        
        emit LiquidityRemoved(_tokenAddress, _amount);
    }
    
    /**
     * @dev Mettre à jour les frais de trading (seulement le propriétaire)
     */
    function setTradingFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee cannot exceed 10%"); // Max 10%
        tradingFee = _newFee;
        emit TradingFeeUpdated(_newFee);
    }
    
    /**
     * @dev Retirer les fonds CHZ du contrat (seulement le propriétaire)
     */
    function withdrawFunds(uint256 _amount) external onlyOwner {
        require(_amount <= chzToken.balanceOf(address(this)), "Insufficient contract balance");
        chzToken.safeTransfer(owner(), _amount);
        emit FundsWithdrawn(owner(), _amount);
    }
    
    /**
     * @dev Pauser/dépauser le contrat
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Fonction d'urgence pour retirer tous les fonds
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = chzToken.balanceOf(address(this));
        if (balance > 0) {
            chzToken.safeTransfer(owner(), balance);
        }
    }
}
