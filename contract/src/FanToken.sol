// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title FanToken
 * @dev Token ERC20 pour les équipes de football avec fonctionnalités spéciales
 */
contract FanToken is ERC20, Ownable, Pausable {
    
    // Métadonnées de l'équipe
    string public teamName;
    string public league;
    string public country;
    string public logoURI;
    
    // Supply et distribution
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18; // 100M tokens max
    
    // Événements
    event TeamInfoUpdated(string teamName, string league, string country);
    event LogoUpdated(string newLogoURI);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _teamName,
        string memory _league,
        string memory _country,
        string memory _logoURI,
        uint256 _initialSupply
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        teamName = _teamName;
        league = _league;
        country = _country;
        logoURI = _logoURI;
        
        // Mint le supply initial au déployeur
        _mint(msg.sender, _initialSupply * 10**decimals());
        
        emit TeamInfoUpdated(_teamName, _league, _country);
        emit LogoUpdated(_logoURI);
    }
    
    /**
     * @dev Mint de nouveaux tokens (seulement le propriétaire)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev Brûler des tokens (seulement le propriétaire)
     */
    function burn(uint256 amount) external onlyOwner {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance to burn");
        
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }
    
    /**
     * @dev Mettre à jour les informations de l'équipe
     */
    function updateTeamInfo(
        string memory _teamName,
        string memory _league,
        string memory _country
    ) external onlyOwner {
        teamName = _teamName;
        league = _league;
        country = _country;
        
        emit TeamInfoUpdated(_teamName, _league, _country);
    }
    
    /**
     * @dev Mettre à jour le logo
     */
    function updateLogo(string memory _logoURI) external onlyOwner {
        logoURI = _logoURI;
        emit LogoUpdated(_logoURI);
    }
    
    /**
     * @dev Pauser les transferts
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Dépauser les transferts
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Obtenir toutes les informations de l'équipe
     */
    function getTeamInfo() external view returns (
        string memory _teamName,
        string memory _league,
        string memory _country,
        string memory _logoURI,
        uint256 _totalSupply,
        uint256 _maxSupply
    ) {
        return (teamName, league, country, logoURI, totalSupply(), MAX_SUPPLY);
    }
    
    /**
     * @dev Override pour ajouter la fonctionnalité pause
     */
    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }
}
