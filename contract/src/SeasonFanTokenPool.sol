// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract SeasonFanTokenPool {
    IERC20 public fanToken;
    IERC20 public rewardToken;
    uint256 public seasonEnd;
    mapping(address => uint256) public staked;
    mapping(address => uint256) public rewards;

    constructor(address _fanToken, address _rewardToken, uint256 _seasonEnd) {
        fanToken = IERC20(_fanToken);
        rewardToken = IERC20(_rewardToken);
        seasonEnd = _seasonEnd; // timestamp de fin de saison
    }

    function stake(uint256 amount) external {
        require(block.timestamp < seasonEnd, "Pool closed");
        require(amount > 0, "Amount must be > 0");
        fanToken.transferFrom(msg.sender, address(this), amount);
        staked[msg.sender] += amount;
        // Calcul dynamique : 1 PSG token en plus chaque semaine écoulée depuis le début de la saison
        uint256 weeksElapsed = (block.timestamp < seasonEnd ? block.timestamp : seasonEnd) / 1 weeks;
        uint256 seasonStart = seasonEnd - ((seasonEnd / 1 weeks) * 1 weeks);
        if (block.timestamp > seasonStart) {
            weeksElapsed = (block.timestamp - seasonStart) / 1 weeks;
        } else {
            weeksElapsed = 0;
        }
        uint256 dynamicReward = amount + weeksElapsed * 1e18; // suppose 18 décimales
        rewards[msg.sender] += dynamicReward;
        rewards[msg.sender] += amount; // simple 1:1 pour l'exemple
    }

    function claim() external {
        require(block.timestamp >= seasonEnd, "Season not ended");
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No reward");
        rewards[msg.sender] = 0;
        rewardToken.transfer(msg.sender, reward);
    }

    function withdraw() external {
        require(block.timestamp >= seasonEnd, "Season not ended");
        uint256 amount = staked[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        staked[msg.sender] = 0;
        fanToken.transfer(msg.sender, amount);
    }
}