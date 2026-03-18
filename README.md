<h1 align="center">A Simple Trust-Aware Smart Contract Prototype for Access Control</h1>

<p align="center"><strong>Solidity + Hardhat minimal research prototype</strong></p>

[Chinese Version](./README_zh.md)

## Overview

This project presents a simple trust-aware smart contract prototype for
agent-based access control. It is developed with Solidity and Hardhat.

The prototype demonstrates how interaction outcomes can be used to update
trust scores, and how trust scores can be used to enforce layered access
permissions. The system also records on-chain events to support basic
auditability.

This project is intended as a minimal research prototype rather than a
production-ready system.

## Design Tradeoffs

- The current system is an admin-centered trust oracle.
- The main goal is to demonstrate trust-based access logic.
- It is not designed as decentralized governance or a production-grade
  permission system.

## Limitations

This prototype has several intentional limitations.

- Trust registration and trust-score updates are controlled by a single
  administrator, so the current design is centralized rather than
  decentralized.
- The trust update rules and access thresholds are manually defined for
  demonstration purposes and are not derived from empirical data or adaptive
  learning.
- Access decisions are based on a single trust score and do not yet
  incorporate richer contextual factors such as task type, evidence quality,
  or historical uncertainty.
- Validation in this submission is limited to local compilation and automated
  tests, rather than public-network deployment or large-scale experimental
  evaluation.

## Main Features

- Register agent addresses by the administrator
- Submit interaction results for registered agents
- Automatically update trust scores after each interaction
- Evaluate whether an agent can perform normal or sensitive operations
- Record trust updates and access decisions through on-chain events

## Trust Update Rules

The trust score is maintained within the range of 0 to 100.

- If an interaction is successful and compliant, the trust score increases by 10
- If an interaction is successful but non-compliant, the trust score decreases
  by 10
- If an interaction fails, the trust score decreases by 20

## Access Control Rules

The contract applies layered access control based on the current trust score.

- If the trust score is below 50, both normal and sensitive operations are
  denied
- If the trust score is between 50 and 79, normal operations are allowed but
  sensitive operations are denied
- If the trust score is 80 or above, both normal and sensitive operations are
  allowed

## Events

The contract emits the following events for transparency and auditability:

- `AgentRegistered`: records the registration of a new agent
- `InteractionRecorded`: records submitted interaction outcomes
- `TrustUpdated`: records the previous and updated trust score
- `AccessDecision`: records whether an access request is allowed or denied

## Project Structure

```text
contracts/
  TrustAccessControl.sol    # Smart contract implementation

test/
  TrustAccessControl.ts     # Automated test cases

scripts/
  deploy.ts                 # Optional local deployment script for future extension
```

## Requirements

- Node.js and npm
- No global Hardhat installation is required
- Install project dependencies locally with `npm install`
- Verified locally with Node.js `v24.13.1` and npm `11.8.0`

## Verified Reproduction Steps

Enter the project directory:

```cmd
cd <project-directory>
```

Install dependencies:

```cmd
npm install
```

Compile the contract:

```cmd
npx hardhat compile
```

Run the test suite:

```cmd
npm test
```

## Current Status

- The contract compiles successfully
- All test cases pass
- The prototype has implemented trust score update logic
- The prototype supports layered access control
- The prototype records key actions through events for basic auditability

## Notes

- The verified workflow for this submission is `install -> compile -> test`
- The current deployment script is included for local experimentation and future
  extension, but it is not part of the verified submission workflow
- This project focuses on demonstrating the core idea of trust-aware access
  control
- The prototype can be extended in the future with multi-aspect trust
  models, weighted evidence, or public testnet deployment

## Future Work

Possible extensions include:

- Multi-aspect trust evaluation
- Weighted interaction evidence
- More fine-grained access policies
- Testnet deployment and verification
- Front-end integration for demonstration
