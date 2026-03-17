// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TrustAccessControl {
    address public admin;

    struct Agent {
        bool registered;
        uint8 trustScore;
        uint256 interactionCount;
    }

    mapping(address => Agent) public agents;

    event AgentRegistered(address indexed agent, uint8 initialTrust);

    event InteractionRecorded(
        address indexed agent,
        bool success,
        bool compliant, // 是否合规
        uint256 interactionCount
    );

    event TrustUpdated( // 更新 agent 的 trust
        address indexed agent,
        uint8 oldTrust,
        uint8 newTrust
    );
    //访问决策
    event AccessDecision(
        address indexed agent,
        string actionType, //请求的操作类型, 暂定normal和sensitive
        bool allowed,
        uint8 trustScore
    );

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
        agents[agentAddr] = Agent({
            registered: true,
            trustScore: 60,
            interactionCount: 0
        }); // 新的 agent 注册，没有交互记录

        // 发出一条事件日志，表示这个 agent 已注册，初始信任值是 60
        emit AgentRegistered(agentAddr, 60);
    }

    // 新增函数：记录一次交互结果并更新 trust
    function submitInteractionResult(
        address agentAddr,
        bool success,
        bool compliant
    ) public onlyAdmin {
        // 未注册不允许提交
        require(agents[agentAddr].registered, "Agent not registered");

        uint8 oldTrust = agents[agentAddr].trustScore;
        uint8 newTrust = oldTrust;

        /*
        success == true && compliant == true: +10
        success == true && compliant == false: -10
        success == false: -20
        */
        if (success && compliant) {
            if (oldTrust > 90) {
                newTrust = 100;
            } else {
                newTrust = oldTrust + 10;
            }
        } else if (success && !compliant) {
            if (oldTrust < 10) {
                newTrust = 0;
            } else {
                newTrust = oldTrust - 10;
            }
        } else {
            // 除上述情况外，其余都视为失败
            if (oldTrust < 20) {
                newTrust = 0;
            } else {
                newTrust = oldTrust - 20;
            }
        }

        agents[agentAddr].trustScore = newTrust;
        // 交互次数加一
        agents[agentAddr].interactionCount += 1; 

        // 记录 trust 更新和本次交互
        emit TrustUpdated(agentAddr, oldTrust, newTrust);
        emit InteractionRecorded(
            agentAddr,
            success,
            compliant,
            agents[agentAddr].interactionCount
        );
    }
    function canAccess(
        address agentAddr,
        string memory actionType //动态类型 要带memory
    ) public returns (bool){
        require(agents[agentAddr].registered, "Agent not registered"); //未注册直接报错

        uint8 trust = agents[agentAddr].trustScore;
        bool allowed;

        //keccak256表示字节序列做哈希, 比较哈希值是否相等
        if (keccak256(bytes(actionType)) == keccak256(bytes("sensitive"))){
            allowed = trust >= 80;
        }else if (keccak256(bytes(actionType)) == keccak256(bytes("normal"))){
            allowed = trust >= 50;
        }else{
            revert("Unknown action type");//直接报错并回滚
        }
        //链上留下日志，便于审计
        emit AccessDecision(agentAddr,actionType, allowed, trust); 
        //调用者立即得到结果
        return allowed; 
    }
    
}
