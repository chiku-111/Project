import { expect } from "chai"; 
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("TrustAccessControl", function () {
  it("allows the admin to register an agent", async function () {
    const [admin, agent] = await ethers.getSigners();
    const contract = await ethers.deployContract("TrustAccessControl", [], admin);

    // 预期管理员注册成功
    await expect(contract.registerAgent(agent.address))
      .to.emit(contract, "AgentRegistered")
      .withArgs(agent.address, 60);

    const storedAgent = await contract.agents(agent.address);
    expect(storedAgent.registered).to.equal(true);
    // 检查链上状态
    expect(storedAgent.trustScore).to.equal(60);
  });

  it("rejects registration from a non-admin account", async function () {
    // attacker 是非管理员用户
    const [admin, agent, attacker] = await ethers.getSigners();
    const contract = await ethers.deployContract("TrustAccessControl", [], admin);

    await expect(
      // 预期非管理员用户会失败
      contract.connect(attacker).registerAgent(agent.address),
    ).to.be.revertedWith("Only admin can call this");
  });

  it("records an interaction for a registered agent", async function () {
    // 两个测试账户
    const [admin, agent] = await ethers.getSigners();
    // 管理员部署合约
    const contract = await ethers.deployContract("TrustAccessControl", [], admin);
    // agent 注册进去
    await contract.registerAgent(agent.address);

    await expect(contract.submitInteractionResult(agent.address, true, true))
      .to.emit(contract, "InteractionRecorded")
      // 检查事件参数是否正确，1 表示第一次交互
      .withArgs(agent.address, true, true, 1);

    const storedAgent = await contract.agents(agent.address);
    // 读取链上存储的计数
    expect(storedAgent.interactionCount).to.equal(1);
  });

  it("rejects interaction submission from a non-admin account", async function () {
    const [admin, agent, attacker] = await ethers.getSigners();
    const contract = await ethers.deployContract("TrustAccessControl", [], admin);

    await contract.registerAgent(agent.address);

    await expect(
      // 切换调用者身份
      contract.connect(attacker).submitInteractionResult(agent.address, true, true),
    ).to.be.revertedWith("Only admin can call this");
  });

  // 未注册时提交应失败
  it("rejects interaction submission for an unregistered agent", async function () {
    const [admin, agent] = await ethers.getSigners();
    const contract = await ethers.deployContract("TrustAccessControl", [], admin);

    await expect(
      contract.submitInteractionResult(agent.address, true, false),
    ).to.be.revertedWith("Agent not registered");
  });

  it("increases trust by 10 for a successful and compliant interaction", async function () {
    const [admin, agent] = await ethers.getSigners();
    const contract = await ethers.deployContract("TrustAccessControl", [], admin);

    await contract.registerAgent(agent.address);
    await expect(
      contract.submitInteractionResult(agent.address, true, true)
    )
      .to.emit(contract, "TrustUpdated")
      .withArgs(agent.address, 60, 70);//事件断言, 交互后是否发出TrustUpdated事件。检查过程记录

    const storedAgent = await contract.agents(agent.address);
    // 读取链上 agent 当前状态
    expect(storedAgent.trustScore).to.equal(70); //状态断言：如果是 70 就通过, 检查结果
  });

  it("decreases trust by 10 for a successful but non-compliant interaction", async function () {
    const [admin, agent] = await ethers.getSigners();
    const contract = await ethers.deployContract("TrustAccessControl", [], admin);

    await contract.registerAgent(agent.address);
    await expect(
      contract.submitInteractionResult(agent.address, true, false)
    )
      .to.emit(contract,"TrustUpdated")
      .withArgs(agent.address, 60, 50);

    const storedAgent = await contract.agents(agent.address);
    expect(storedAgent.trustScore).to.equal(50);
  });

  // 失败时 trust -20
  it("decreases trust by 20 for a failed interaction", async function () {
    const [admin, agent] = await ethers.getSigners();
    const contract = await ethers.deployContract("TrustAccessControl", [], admin);

    await contract.registerAgent(agent.address);
    await expect(
      contract.submitInteractionResult(agent.address, false, true)
    )
      .to.emit(contract,"TrustUpdated")
      .withArgs(agent.address, 60 ,40); // success == false，就会进入失败逻辑

    const storedAgent = await contract.agents(agent.address);
    expect(storedAgent.trustScore).to.equal(40);
  });

  // 边界测试，trust 不超过 100 也不低于 0
  it("caps trust at 100", async function () {
    const [admin, agent] = await ethers.getSigners();
    const contract = await ethers.deployContract("TrustAccessControl", [], admin);

    await contract.registerAgent(agent.address);

    await contract.submitInteractionResult(agent.address, true, true); // 70，初始值为 60
    await contract.submitInteractionResult(agent.address, true, true); // 80
    await contract.submitInteractionResult(agent.address, true, true); // 90
    await contract.submitInteractionResult(agent.address, true, true); // 100
    await contract.submitInteractionResult(agent.address, true, true); // 仍然 100

    const storedAgent = await contract.agents(agent.address);
    expect(storedAgent.trustScore).to.equal(100);
  });

  it("floors trust at 0", async function () {
    const [admin, agent] = await ethers.getSigners();
    const contract = await ethers.deployContract("TrustAccessControl", [], admin);

    await contract.registerAgent(agent.address);

    await contract.submitInteractionResult(agent.address, false, true); // 60 -> 40
    await contract.submitInteractionResult(agent.address, false, true); // 40 -> 20
    await contract.submitInteractionResult(agent.address, false, true); // 20 -> 0
    await contract.submitInteractionResult(agent.address, false, true); // 仍然 0

    const storedAgent = await contract.agents(agent.address);
    expect(storedAgent.trustScore).to.equal(0);
  });

  it("allows normal access when trust is 60", async function () {
    const [admin, agent] = await ethers.getSigners();
    const contract = await ethers.deployContract("TrustAccessControl", [], admin);
    //先注册再做权限判断
    await contract.registerAgent(agent.address);

    // 检查 normal 操作是否发出 AccessDecision，并记录为允许
    await expect(contract.canAccess(agent.address, "normal")
  )
    .to.emit(contract, "AccessDecision")
    .withArgs(agent.address, "normal", true, 60);

    //staticCall模拟执行,拿返回值,不真的写链上日志
    const allowed = await contract.canAccess.staticCall(agent.address, "normal");
    //检查 canAccess 的返回值是否为 true
    expect(allowed).to.equal(true);
  });

  it("rejects sensitive access when trust is 60", async function () {
    const [admin, agent] = await ethers.getSigners();
    const contract = await ethers.deployContract("TrustAccessControl", [], admin);

    await contract.registerAgent(agent.address);

    // 检查 sensitive 操作是否发出 AccessDecision，并记录为拒绝
    await expect(
      contract.canAccess(agent.address, "sensitive")
    )
      .to.emit(contract,"AccessDecision")
      .withArgs(agent.address, "sensitive", false, 60);//拒绝敏感操作，中间层权限验证

      const allowed = await contract.canAccess.staticCall(agent.address, "sensitive");
      // 检查 canAccess 的返回值是否为 false
      expect(allowed).to.equal(false);
  });

  it("allows sensitive access when trust reaches 80", async function () {
    const [admin, agent] = await ethers.getSigners();
    const contract = await ethers.deployContract("TrustAccessControl", [], admin);

    await contract.registerAgent(agent.address);
    await contract.submitInteractionResult(agent.address, true, true);//60->70
    await contract.submitInteractionResult(agent.address, true, true);//70->80

    await expect(
      contract.canAccess(agent.address, "sensitive")
    )
      .to.emit(contract, "AccessDecision")
      .withArgs(agent.address, "sensitive", true, 80);

      const allowed=await contract.canAccess.staticCall(agent.address, "sensitive");
      expect(allowed).to.equal(true);
  });

  //当trust =50 时, normal 应该允许, sensitive 应该拒绝
  it("allows normal but rejects sensitive access when trust is exactly 50", async function () {
    const [admin, agent] = await ethers.getSigners();
    const contract = await ethers.deployContract("TrustAccessControl", [], admin);
    
    await contract.registerAgent(agent.address);

    //成功但不合规：trust 从 60 -> 50
    await contract.submitInteractionResult(agent.address, true, false);
    // 检查 trust = 50 时，normal 操作是否发出 AccessDecision，并记录为允许
    await expect(
      contract.canAccess(agent.address, "normal")
    )
    .to.emit(contract, "AccessDecision")
    .withArgs(agent.address, "normal", true, 50);

    const normalAllowed = await contract.canAccess.staticCall(agent.address, "normal");
    expect(normalAllowed).to.equal(true);

    // 检查 trust = 50 时，sensitive 操作是否发出 AccessDecision，并记录为拒绝
    await expect(
      contract.canAccess(agent.address, "sensitive")
    )
    .to.emit(contract, "AccessDecision")
    .withArgs(agent.address, "sensitive", false, 50);

    const sensitiveAllowde = await contract.canAccess.staticCall(agent.address, "sensitive");
    expect(sensitiveAllowde).to.equal(false);
  });

  //当 trust <50 时, normal 也不能访问。
  it("rejects normal access when trust drops below 50", async function () {
    const [admin, agent] = await ethers.getSigners();
    const contract = await ethers.deployContract("TrustAccessControl", [], admin);

    await contract.registerAgent(agent.address);
    // 提交一次失败交互: trust 从 60 -> 40
    await contract.submitInteractionResult(agent.address, false, true);
    // 检查 normal 操作是否发出 AccessDecision，并记录为拒绝
    await expect(
      contract.canAccess(agent.address, "normal")
    )
    .to.emit(contract,"AccessDecision")
    .withArgs(agent.address, "normal", false, 40);

    // 用 staticCall 只读取返回值，不重复发交易事件
    const allowed = await contract.canAccess.staticCall(agent.address, "normal");
    expect(allowed).to.equal(false);
  });

  //未注册 agent 调用 canAccess 应该报错
  it("rejects access checks for an unregistered agent", async function () {
    const [admin, agent] = await ethers.getSigners();
    const contract = await ethers.deployContract("TrustAccessControl", [], admin);

    // 未注册的 agent 调用 canAccess 时，应该回滚并报错
    await expect(
      contract.canAccess(agent.address, "normal")
    )
      .to.be.revertedWith("Agent not registered");
  });
  
  it("rejects unknown action types", async function () {
    const [admin, agent] = await ethers.getSigners();
    const contract = await ethers.deployContract("TrustAccessControl", [], admin);

    // 注册 agent, 确保函数能 actionType 判断，不会卡在未注册检查
    await contract.registerAgent(agent.address);

    // 未知操作类型时, canAccess回滚并报错
    await expect(
      contract.canAccess(agent.address, "unknown")
    )
    .to.be.revertedWith("Unknown action type");
  });

});
