import { network } from "hardhat";
//连接网络，取出ethers
/*const result = await network.connect();
const ethers = result.ethers;*/
const { ethers } = await network.connect();

async function main() {
    /*本地测试链取出第一个账户，命名deployer，部署合约的人
    const signers = await ethers.getSigners();
    const deployer = signers[0];*/
    const [deployer] = await ethers.getSigners(); 
    //终端打印哪个地址部署
    console.log("Deploying with account:", deployer.address);

    //发起，用deployer部署合约
    const contract = await ethers.deployContract(
        "TrustAccessControl",
        [],
        deployer
    );
    //等待部署结束
    await contract.waitForDeployment();

    //打印新部署合约地址
    console.log("TrustAccessControl deployed to:", await contract.getAddress());
}

//运行 main()，如果出错，就把错误打印出来，并让脚本以失败状态结束
main().catch(
    (error)=>{
        console.error(error);
        //脚本以失败结束，命令行1表失败
        process.exitCode = 1;
    });