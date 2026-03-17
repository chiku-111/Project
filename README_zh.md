# 基于信任阈值的智能合约访问控制原型

[English Version](./README.md)

## 项目简介

本项目实现了一个面向 agent 访问控制的最小信任感知智能合约原型，基于 Solidity 和 Hardhat 开发。

该原型展示了交互结果如何用于更新 trust score，以及 trust score 如何进一步用于分层权限控制。同时，系统通过链上事件记录来支持基本的可审计性。

本项目定位为一个最小研究原型，而不是一个生产级系统。

## 主要功能

- 由管理员注册 agent 地址
- 为已注册的 agent 提交交互结果
- 每次交互后自动更新 trust score
- 判断 agent 是否可以执行普通操作或敏感操作
- 通过链上事件记录 trust 更新和访问决策

## 信任更新规则

trust score 始终保持在 0 到 100 的范围内。

- 如果交互成功且合规，trust score 增加 10
- 如果交互成功但不合规，trust score 减少 10
- 如果交互失败，trust score 减少 20

## 访问控制规则

合约根据当前 trust score 实现分层访问控制。

- 如果 trust score 小于 50，普通操作和敏感操作都被拒绝
- 如果 trust score 在 50 到 79 之间，普通操作允许，但敏感操作被拒绝
- 如果 trust score 大于等于 80，普通操作和敏感操作都允许

## 事件

合约会发出以下事件，用于提高透明性和可审计性：

- `AgentRegistered`：记录新 agent 的注册
- `InteractionRecorded`：记录交互结果的提交
- `TrustUpdated`：记录 trust score 更新前后的数值
- `AccessDecision`：记录一次访问请求是否被允许

## 项目结构

```text
contracts/
  TrustAccessControl.sol    # 智能合约实现

test/
  TrustAccessControl.ts     # 自动化测试文件

scripts/
  deploy.ts                 # 本地部署脚本
```

## 环境要求

- Node.js
- npm
- Hardhat
- Solidity 编译器（由 Hardhat 管理）

## 运行方式

进入项目目录：

```cmd
cd /d D:\project
```

编译合约：

```cmd
npx hardhat compile
```

运行测试：

```cmd
npm test
```

本地部署合约：

```cmd
npx hardhat run scripts/deploy.ts
```

## 当前状态

- 合约可以成功编译
- 所有测试均已通过
- 原型已经实现 trust score 更新逻辑
- 原型已经实现分层访问控制
- 原型已经通过事件记录关键操作，体现基本可审计性

## 说明

- 当前部署脚本主要用于本地 Hardhat 环境下的部署与演示
- 本项目重点在于展示 trust-aware access control 的核心思路
- 该原型未来可以扩展为多维 trust 模型、加权证据机制或测试网部署版本

## 后续可扩展方向

未来可以考虑增加以下内容：
- 多维信任评估
- 加权交互证据
- 更细粒度的访问控制策略
- 测试网部署与验证
- 用于展示的前端界面
