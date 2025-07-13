// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/SeasonFanTokenPool.sol";

contract DeploySeasonFanTokenPool is Script {
    function run() external {
        // Clé privée du déployeur (set via env ou --private-key)
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Adresses des tokens (remplace par les tiennes)
        address fanTokenAddress = 0xc2661815C69c2B3924D3dd0c2C1358A1E38A3105; // PSG Fan Token par exemple
        address rewardTokenAddress = 0x6401b29F40a02578Ae44241560625232A01B3F79; // Ton token de plateforme
        
        // Date de fin de saison (27 juillet 2025 23:59:59 UTC)
        uint256 seasonEndTimestamp = 1753660799; // timestamp
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Déploiement du contrat
        SeasonFanTokenPool pool = new SeasonFanTokenPool(
            fanTokenAddress,
            rewardTokenAddress, 
            seasonEndTimestamp
        );
        
        vm.stopBroadcast();
        
        console.log("SeasonFanTokenPool deployed at:", address(pool));
        console.log("Fan Token:", fanTokenAddress);
        console.log("Reward Token:", rewardTokenAddress);
        console.log("Season End:", seasonEndTimestamp);
    }
}
