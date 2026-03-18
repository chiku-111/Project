# 基于信任分值的智能合约访问控制原型

[English Version](./README.md)

## 项目简介

这个项目实现了一个面向 agent 访问控制的最小化 trust-aware 智能合约原型，
基于 Solidity 和 Hardhat 开发。

原型重点演示两件事：

- 如何根据交互结果更新 trust score
- 如何基于 trust score 做分层访问控制

系统同时通过链上事件记录关键操作，以支持基础可审计性。

这个项目被定义为最小研究原型，而不是生产级系统。

## 设计取舍

- 当前系统是一个 `admin-centered trust oracle`
- 重点是演示 `trust-based access logic`
- 不是去中心化治理系统，也不是生产级权限系统

在当前合约里，agent 注册和 trust 更新都由 admin 完成。这种中心化设计是刻意
保留的，因为这个原型关注的是 trust 评估与访问决策流程，而不是去中心化协同
治理。

## Limitations

当前原型存在以下有意保留的局限性：

- trust 注册与 trust score 更新由单一管理员控制，因此当前设计是中心化的，而
  不是去中心化的。
- trust 更新规则与访问阈值主要用于演示目的，由人工设定，并非基于经验数据或
  自适应学习得到。
- 当前访问决策主要依赖单一 trust score，尚未纳入任务类型、证据质量或历史不
  确定性等更丰富的上下文因素。
- 原型暂未处理更强的对抗性问题，例如 Sybil attack、串谋或伪造交互证据。
- 本次提交的验证范围主要限于本地编译与自动化测试，尚未覆盖公链部署或大规模
  实验评估。

## 主要功能

- 由管理员注册 agent 地址
- 为已注册的 agent 提交交互结果
- 每次交互后自动更新 trust score
- 判断 agent 是否可以执行普通操作或敏感操作
- 通过链上事件记录 trust 更新与访问决策

## 信任更新规则

trust score 始终保持在 `0` 到 `100` 的范围内。

- 如果交互成功且合规，trust score 增加 `10`
- 如果交互成功但不合规，trust score 减少 `10`
- 如果交互失败，trust score 减少 `20`

## 访问控制规则

合约根据当前 trust score 实现分层访问控制。

- 如果 trust score 小于 `50`，普通操作和敏感操作都被拒绝
- 如果 trust score 在 `50` 到 `79` 之间，普通操作允许，敏感操作拒绝
- 如果 trust score 大于等于 `80`，普通操作和敏感操作都允许

## 事件

合约会发出以下事件，用于增强透明度和基础审计能力：

- `AgentRegistered`：记录新 agent 的注册
- `InteractionRecorded`：记录交互结果的提交
- `TrustUpdated`：记录 trust score 更新前后的数值
- `AccessDecision`：记录访问请求是否被允许

## 项目结构

```text
contracts/
  TrustAccessControl.sol    # 智能合约实现

test/
  TrustAccessControl.ts     # 自动化测试

scripts/
  deploy.ts                 # 用于后续扩展的可选本地部署脚本
```

## 环境要求

- Node.js 和 npm
- 不需要全局安装 Hardhat
- 先通过 `npm install` 安装项目本地依赖
- 本地验证环境为 Node.js `v24.13.1` 与 npm `11.8.0`

## 已验证的复现步骤

进入项目目录：

```cmd
cd <project-directory>
```

安装依赖：

```cmd
npm install
```

编译合约：

```cmd
npx hardhat compile
```

运行测试：

```cmd
npm test
```

## 当前状态

- 合约可以成功编译
- 所有测试均已通过
- 原型已经实现 trust score 更新逻辑
- 原型已经实现分层访问控制
- 原型已经通过事件记录关键操作，体现基础可审计性

## 说明

- 本次提交已验证的流程是 `安装依赖 -> 编译 -> 测试`
- 当前部署脚本用于本地实验和后续扩展，不属于本次提交的已验证复现流程
- 项目重点在于展示 trust-aware access control 的核心思路
- 后续可以扩展为 multi-aspect trust 模型、加权证据机制或公测网部署版本

## 后续可扩展方向

- Multi-aspect trust evaluation
- 加权交互证据
- 更细粒度的访问控制策略
- 测试网部署与验证
- 用于演示的前端界面
