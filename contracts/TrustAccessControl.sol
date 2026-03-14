// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TrustAccessControl {
    address public admin;

    struct Agent {
        bool registered;
        uint8 trustScore;
    }

    mapping(address => Agent) public agents;

    event AgentRegistered(address indexed agent, uint8 initialTrust);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        // 真正的函数主体从这里继续执行
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function registerAgent(address agentAddr) public onlyAdmin {
        // 检查地址是不是空地址，空地址直接报错
        require(agentAddr != address(0), "Invalid agent address");
        // 检查地址是不是已经注册过，注册过就报错
        require(!agents[agentAddr].registered, "Agent already registered");

        // 把这个地址写进 agents 里，并给它一个初始 trust 60
        agents[agentAddr] = Agent({registered: true, trustScore: 60});

        // 发出一条事件日志，表示这个 agent 已注册，初始信任值是 60
        emit AgentRegistered(agentAddr, 60);
    }
}
