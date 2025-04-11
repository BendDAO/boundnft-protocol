import { Contract, Signer, utils, ethers, BigNumberish } from "ethers";
import { signTypedData_v4 } from "eth-sig-util";
import { fromRpcSig, ECDSASignature } from "ethereumjs-util";
import BigNumber from "bignumber.js";
import { ZERO_ADDRESS } from "./constants";
import { getDb, DRE, waitForTx, notFalsyOrZeroAddress } from "./misc-utils";
import {
  tEthereumAddress,
  eContractid,
  tStringTokenSmallUnits,
  eEthereumNetwork,
  BendPools,
  iParamsPerNetwork,
  iParamsPerPool,
  eNetwork,
  iParamsPerNetworkAll,
  iEthereumParamsPerNetwork,
} from "./types";
import { MintableERC721 } from "../types/MintableERC721";
import { Artifact } from "hardhat/types";
import { verifyEtherscanContract } from "./etherscan-verification";
import { getDeploySigner } from "./contracts-getters";
import { ConfigNames, loadPoolConfig } from "./configuration";
import { string } from "hardhat/internal/core/params/argumentTypes";

export type MockNftMap = { [symbol: string]: MintableERC721 };

export const registerContractInJsonDb = async (contractId: string, contractInstance: Contract) => {
  const currentNetwork = DRE.network.name;
  const FORK = process.env.FORK;
  if (FORK || (currentNetwork !== "hardhat" && !currentNetwork.includes("coverage"))) {
    console.log(`*** ${contractId} ***\n`);
    console.log(`Network: ${currentNetwork}`);
    console.log(`tx: ${contractInstance.deployTransaction.hash}`);
    console.log(`contract address: ${contractInstance.address}`);
    console.log(`deployer address: ${contractInstance.deployTransaction.from}`);
    console.log(`gas price: ${contractInstance.deployTransaction.gasPrice}`);
    console.log(`gas used: ${contractInstance.deployTransaction.gasLimit}`);
    console.log(`\n******`);
    console.log();
  }

  await getDb(currentNetwork)
    .set(`${contractId}`, {
      address: contractInstance.address,
      deployer: contractInstance.deployTransaction.from,
    })
    .write();

  console.log(
    "contracts-helpers:registerContractInJsonDb,",
    "contractId:",
    contractId,
    "address:",
    contractInstance.address,
    "deployer",
    contractInstance.deployTransaction.from
  );
};

export const insertContractAddressInDb = async (id: eContractid, address: tEthereumAddress) => {
  console.log("contracts-helpers:insertContractAddressInDb,", "id:", id, "address", address);
  await getDb(DRE.network.name)
    .set(`${id}`, {
      address,
    })
    .write();
};

export const rawInsertContractAddressInDb = async (id: string, address: tEthereumAddress) => {
  console.log("contracts-helpers:rawInsertContractAddressInDb,", "id:", id, "address", address);
  await getDb(DRE.network.name)
    .set(`${id}`, {
      address,
    })
    .write();
};

export const getContractAddressInDb = async (id: string): Promise<tEthereumAddress> => {
  const contractAtDb = await getDb(DRE.network.name).get(`${id}`).value();
  if (contractAtDb?.address) {
    return contractAtDb.address as tEthereumAddress;
  }
  throw Error(`Missing contract address ${id} at Market config and JSON local db`);
};

export const tryGetContractAddressInDb = async (id: string): Promise<tEthereumAddress> => {
  const contractAtDb = await getDb(DRE.network.name).get(`${id}`).value();
  if (contractAtDb?.address) {
    return contractAtDb.address as tEthereumAddress;
  }
  return ZERO_ADDRESS;
};

export const getEthersSigners = async (): Promise<Signer[]> => {
  const ethersSigners = await Promise.all(await DRE.ethers.getSigners());
  return ethersSigners;
};

export const getEthersSignerByAddress = async (address: string): Promise<Signer> => {
  const ethersSigner = await DRE.ethers.getSigner(address);
  return ethersSigner;
};

export const getEthersSignersAddresses = async (): Promise<tEthereumAddress[]> =>
  await Promise.all((await getEthersSigners()).map((signer) => signer.getAddress()));

export const getCurrentBlock = async () => {
  return DRE.ethers.provider.getBlockNumber();
};

export const decodeAbiNumber = (data: string): number =>
  parseInt(utils.defaultAbiCoder.decode(["uint256"], data).toString());

export const deployContract = async <ContractType extends Contract>(
  contractName: string,
  args: any[]
): Promise<ContractType> => {
  console.log("contracts-helpers:deployContract,", "contractName", contractName);
  const contract = (await (await DRE.ethers.getContractFactory(contractName))
    .connect(await getDeploySigner())
    .deploy(...args)) as ContractType;
  await waitForTx(contract.deployTransaction);
  await registerContractInJsonDb(<eContractid>contractName, contract);
  return contract;
};

export const withSaveAndVerify = async <ContractType extends Contract>(
  instance: ContractType,
  id: string,
  args: (string | string[])[],
  verify?: boolean
): Promise<ContractType> => {
  //console.log('contracts-helpers:withSaveAndVerify,','id',id)
  await waitForTx(instance.deployTransaction);
  await registerContractInJsonDb(id, instance);
  if (verify) {
    await verifyContract(id, instance, args);
  }
  return instance;
};

export const getContract = async <ContractType extends Contract>(
  contractName: string,
  address: string
): Promise<ContractType> => (await DRE.ethers.getContractAt(contractName, address)) as ContractType;

export const linkBytecode = (artifact: Artifact, libraries: any) => {
  let bytecode = artifact.bytecode;

  for (const [fileName, fileReferences] of Object.entries(artifact.linkReferences)) {
    for (const [libName, fixups] of Object.entries(fileReferences)) {
      const addr = libraries[libName];

      if (addr === undefined) {
        continue;
      }

      for (const fixup of fixups) {
        bytecode =
          bytecode.substr(0, 2 + fixup.start * 2) +
          addr.substr(2) +
          bytecode.substr(2 + (fixup.start + fixup.length) * 2);
      }
    }
  }

  return bytecode;
};

export const getParamPerNetwork = <T>(param: iParamsPerNetwork<T>, network: eNetwork) => {
  const { main, rinkeby, goerli, sepolia, localhost, hardhat, coverage, curtis, apechain } =
    param as iEthereumParamsPerNetwork<T>;
  if (process.env.FORK) {
    return param[process.env.FORK as eNetwork] as T;
  }

  switch (network) {
    case eEthereumNetwork.coverage:
      return coverage;
    case eEthereumNetwork.hardhat:
      return hardhat;
    case eEthereumNetwork.localhost:
      return localhost;
    case eEthereumNetwork.sepolia:
      return sepolia;
    case eEthereumNetwork.goerli:
      return goerli;
    case eEthereumNetwork.rinkeby:
      return rinkeby;
    case eEthereumNetwork.main:
      return main;
    case eEthereumNetwork.curtis:
      return curtis;
    case eEthereumNetwork.apechain:
      return apechain;
  }

  return hardhat;
};

export const getOptionalParamAddressPerNetwork = (
  param: iParamsPerNetwork<tEthereumAddress> | undefined | null,
  network: eNetwork
) => {
  if (!param) {
    return ZERO_ADDRESS;
  }
  return getParamPerNetwork(param, network);
};

export const getParamPerPool = <T>({ proto }: iParamsPerPool<T>, pool: BendPools) => {
  switch (pool) {
    case BendPools.proto:
      return proto;
    default:
      return proto;
  }
};

export const getSignatureFromTypedData = (
  privateKey: string,
  typedData: any // TODO: should be TypedData, from eth-sig-utils, but TS doesn't accept it
): ECDSASignature => {
  const signature = signTypedData_v4(Buffer.from(privateKey.substring(2, 66), "hex"), {
    data: typedData,
  });
  return fromRpcSig(signature);
};

export const verifyContract = async (id: string, instance: Contract, args: (string | string[])[]) => {
  if (id == eContractid.BNFTUpgradeableProxy) {
    await verifyEtherscanContract(
      instance.address,
      args,
      "contracts/libraries/BNFTUpgradeableProxy.sol:BNFTUpgradeableProxy"
    );
  } else if (id == eContractid.ProxyAdmin || id == eContractid.ProxyAdminWithoutTimelock) {
    await verifyEtherscanContract(instance.address, args, "contracts/libraries/BNFTProxyAdmin.sol:BNFTProxyAdmin");
  } else {
    await verifyEtherscanContract(instance.address, args);
  }
  return instance;
};

export const getContractAddressWithJsonFallback = async (id: string, pool: ConfigNames): Promise<tEthereumAddress> => {
  const poolConfig = loadPoolConfig(pool);
  const network = <eNetwork>DRE.network.name;
  const db = getDb(network);

  const contractAtMarketConfig = getOptionalParamAddressPerNetwork(poolConfig[id], network);
  if (notFalsyOrZeroAddress(contractAtMarketConfig)) {
    return contractAtMarketConfig;
  }

  const contractAtDb = await getDb(DRE.network.name).get(`${id}`).value();
  if (contractAtDb?.address) {
    return contractAtDb.address as tEthereumAddress;
  }
  throw Error(`Missing contract address ${id} at Market config and JSON local db`);
};
