[![Build](https://github.com/BendDAO/boundnft-protocol/actions/workflows/node.js.yml/badge.svg)](https://github.com/BendDAO/boundnft-protocol/actions/workflows/node.js.yml)
[![codecov](https://codecov.io/gh/BendDAO/boundnft-protocol/graph/badge.svg?token=V3Y3Zhugt6)](https://codecov.io/gh/BendDAO/boundnft-protocol)

```
######                              #     # ####### ####### 
#     #  ####  #    # #    # #####  ##    # #          #    
#     # #    # #    # ##   # #    # # #   # #          #    
######  #    # #    # # #  # #    # #  #  # #####      #    
#     # #    # #    # #  # # #    # #   # # #          #    
#     # #    # #    # #   ## #    # #    ## #          #    
######   ####   ####  #    # #####  #     # #          #    
```

# Bound NFT Protocol

This repository contains the smart contracts source code and configuration for Bound NFT Protocol. The repository uses Hardhat as development enviroment for compilation, testing and deployment tasks.

## What is Bound NFT?

Bound NFT is a Soul Bound of NFT protocol where application protocols can participate as minters.

## Documentation

The documentation of Bound NFT Protocol is in the following [Developers Documentation](https://docs.benddao.xyz/developers/) link. At the documentation you can learn more about the protocol, see the contract interfaces, integration guides and audits.

For getting the latest contracts addresses, please check the [Deployed contracts](https://docs.benddao.xyz/developers/deployed-contracts/boundnft-protocol) page at the documentation to stay up to date.

A more detailed and technical description of the protocol can be found in this repository, [here](./docs).

## Audits
Please look at [here](https://docs.benddao.xyz/portal/risk/security-and-audits).

## Connect with the community

You can join at the [Discord](https://discord.gg/benddao) channel or at the [Governance Forum](https://governance.benddao.xyz/) for asking questions about the protocol or talk about BoundNFT with other peers.

## Setup

The repository uses Docker Compose to manage sensitive keys and load the configuration. Prior any action like test or deploy, you must run `docker-compose up` to start the `contracts-env` container, and then connect to the container console via `docker-compose exec contracts-env bash`.

Follow the next steps to setup the repository:

- Install `docker` and `docker-compose`
- Create an enviroment file named `.env` and fill the next enviroment variables

```
# Mnemonic, only first address will be used
MNEMONIC=""

# Add Alchemy or Infura provider keys, alchemy takes preference at the config level
ALCHEMY_KEY=""
INFURA_KEY=""

# Optional Etherscan key, for automatize the verification of the contracts at Etherscan
ETHERSCAN_KEY=""

```

## Protocol configuration

The configurations related with the BNFT Protocol are located at `configs` directory. You can follow the `IMainConfiguration` interface to create new configuration or extend the current BNFT configuration.

## Test

You can run the full test suite with the following commands:

```
# In one terminal
docker-compose up

# Open another tab or terminal
docker-compose exec contracts-env bash

# Install dependencies
npm install --force

# A new Bash terminal is prompted, connected to the container
npm run test
```

## Deployments

For deploying BNFT Protocol, you can use the available scripts located at `package.json`. For a complete list, run `npm run` to see all the tasks.

### Prepare
```
# In one terminal
docker-compose up

# Open another tab or terminal
docker-compose exec contracts-env bash

# Install dependencies
npm install --force

# Runing NPM task
npm run xxx
```

### Localhost deployment
```
# In first terminal
npm run hardhat:node

# In second terminal
npm run localhost:dev:migration
```

### Rinkeby deployment
```
# In one terminal
npm run rinkeby:full:migration
```

## Tools

This project integrates other tools commonly used alongside Hardhat in the ecosystem.

It also comes with a variety of other tools, preconfigured to work with the project code.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.js
node scripts/deploy.js
npx eslint '**/*.js'
npx eslint '**/*.js' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

## Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.template file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/deploy.js
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```
