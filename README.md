# Staking Pool

A dummy staking pool implementation based on EVM.

## General Idea

Liquidity providers (of an arbitrary automated market making protocol) should be rewarded for long-term liquidity provision. Therefore they can stake their LP tokens in a smart contract that, over time, rewards them with honorable badges.

## Functional Requirements 

- liquidity providers can stake their LP tokens
- after a certain time period has passed they can claim a *non-transferable* badge once
- the badge should follow the non-fungible token or multi-token standard
- how long this time period takes should be dependent on the amount of staked tokens (large-scale LPs should get their badge faster)
- there are three badge levels, distinguishable by their metadata
- stakers first can claim a "level-1 badge", if they continue to stake, they can at some point claim a "level-2 badge" and so forth
- every time a staker claims their badge from the next level they lose all badges from lower levels

## Prerequisites

- NodeJs: ^16.15.0
- NPM: ^8.11.0

## Setup

Install dependencies:

```sh
npm install
```

## Run

- Deploy contracts to local network:

```sh
npm run deploy
```

- Test contracts:

```sh
npm run test
```
