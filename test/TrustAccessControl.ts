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

});
