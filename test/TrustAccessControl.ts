import { expect } from "chai";//断言
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("TrustAccessControl", function () {
  it("allows the admin to register an agent", async function () {
    const [admin, agent] = await ethers.getSigners();
    const contract = await ethers.deployContract("TrustAccessControl", [], admin);

    await expect(contract.registerAgent(agent.address))
      .to.emit(contract, "AgentRegistered")
      .withArgs(agent.address, 60);

    const storedAgent = await contract.agents(agent.address);
    expect(storedAgent.registered).to.equal(true);
    expect(storedAgent.trustScore).to.equal(60);
  });

  it("rejects registration from a non-admin account", async function () {
    const [admin, agent, attacker] = await ethers.getSigners();//attacker 非管理员用户
    const contract = await ethers.deployContract("TrustAccessControl", [], admin);

    await expect(
      contract.connect(attacker).registerAgent(agent.address),
    ).to.be.revertedWith("Only admin can call this");
  });
});
