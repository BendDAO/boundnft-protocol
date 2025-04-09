import { TestEnv, makeSuite } from "./helpers/make-suite";
import { ZERO_ADDRESS } from "../helpers/constants";
import { deployMintableERC721, deployGenericBNFTImpl } from "../helpers/contracts-deployments";
import { getBNFT, getDeploySigner, getIErc721Detailed } from "../helpers/contracts-getters";
import { waitForTx } from "../helpers/misc-utils";
import { MockDelegationRegistryFactory, MockDelegationRegistryV2Factory } from "../types";

const { expect } = require("chai");

makeSuite("BNFTRegistry", (testEnv: TestEnv) => {
  before(async () => {});

  it("Creates the BNFT for duplicate NFT asset", async () => {
    const { bnftRegistry, bayc } = testEnv;

    await expect(bnftRegistry.createBNFT(bayc.address)).to.be.revertedWith("BNFTR: asset exist");
  });

  it("Creates the BNFT for nonexistent NFT asset", async () => {
    const { bnftRegistry } = testEnv;

    const testNftAsset = await deployMintableERC721(["testNftAsset1", "TNFT1"]);

    const allProxyLenBefore = await bnftRegistry.allBNFTAssetLength();

    await waitForTx(await bnftRegistry.createBNFT(testNftAsset.address));

    const allProxyLenAfter = await bnftRegistry.allBNFTAssetLength();

    expect(Number(allProxyLenAfter)).to.be.equal(Number(allProxyLenBefore) + 1);

    const nftAddrByAddr = await bnftRegistry.getBNFTAddresses(testNftAsset.address);
    expect(nftAddrByAddr).to.not.equal(undefined);
    expect(nftAddrByAddr.bNftProxy).to.not.equal(undefined);
    expect(nftAddrByAddr.bNftImpl).to.not.equal(undefined);
    expect(nftAddrByAddr.bNftProxy).to.not.equal(ZERO_ADDRESS);
    expect(nftAddrByAddr.bNftImpl).to.not.equal(ZERO_ADDRESS);
    expect(nftAddrByAddr.bNftProxy).to.not.equal(nftAddrByAddr.bNftImpl);

    const nftAddrByidx = await bnftRegistry.getBNFTAddressesByIndex(Number(allProxyLenAfter) - 1);
    expect(nftAddrByidx.bNftProxy).to.equal(nftAddrByAddr.bNftProxy);
    expect(nftAddrByidx.bNftImpl).to.equal(nftAddrByAddr.bNftImpl);

    const testNftProxyInst = await getIErc721Detailed(nftAddrByAddr.bNftProxy);

    const wantName = (await bnftRegistry.namePrefix()) + " " + (await testNftAsset.symbol());
    expect(wantName).to.equal(await testNftProxyInst.name());

    const wantSymbol = (await bnftRegistry.symbolPrefix()) + (await testNftAsset.symbol());
    expect(wantSymbol).to.equal(await testNftProxyInst.symbol());
  });

  it("Creates the BNFT with implement for nonexistent NFT asset", async () => {
    const { bnftRegistry } = testEnv;

    const testNftAsset = await deployMintableERC721(["testNftAsset2", "TNFT2"]);

    const testBNFTImpl = await deployGenericBNFTImpl(false);

    const allProxyLenBefore = await bnftRegistry.allBNFTAssetLength();

    await waitForTx(await bnftRegistry.createBNFTWithImpl(testNftAsset.address, testBNFTImpl.address));

    const allProxyLenAfter = await bnftRegistry.allBNFTAssetLength();

    expect(Number(allProxyLenAfter)).to.be.equal(Number(allProxyLenBefore) + 1);

    const { bNftProxy, bNftImpl } = await bnftRegistry.getBNFTAddresses(testNftAsset.address);

    expect(bNftProxy).to.not.equal(ZERO_ADDRESS);
    expect(bNftImpl).to.be.equal(testBNFTImpl.address);
    expect(bNftProxy).to.not.equal(bNftImpl);

    const testNftProxyInst = await getIErc721Detailed(bNftProxy);

    const wantName = (await bnftRegistry.namePrefix()) + " " + (await testNftAsset.symbol());
    expect(wantName).to.equal(await testNftProxyInst.name());

    const wantSymbol = (await bnftRegistry.symbolPrefix()) + (await testNftAsset.symbol());
    expect(wantSymbol).to.equal(await testNftProxyInst.symbol());
  });

  it("Creates the BNFT with implement for duplicate NFT asset", async () => {
    const { bnftRegistry, bayc } = testEnv;

    const testBNFTImpl = await deployGenericBNFTImpl(false);

    await expect(bnftRegistry.createBNFTWithImpl(bayc.address, testBNFTImpl.address)).to.be.revertedWith(
      "BNFTR: asset exist"
    );
  });

  it("Upgrades the BNFT with implement for existent NFT asset", async () => {
    const { bnftRegistry, bayc } = testEnv;

    const testBNFTImpl = await deployGenericBNFTImpl(false);

    await waitForTx(await bnftRegistry.upgradeBNFTWithImpl(bayc.address, testBNFTImpl.address, []));

    const { bNftProxy, bNftImpl } = await bnftRegistry.getBNFTAddresses(bayc.address);

    expect(bNftImpl).to.be.equal(testBNFTImpl.address);
  });

  it("Upgrades the BNFT with implement for nonexistent NFT asset", async () => {
    const { bnftRegistry, bayc } = testEnv;

    const testNftAsset = await deployMintableERC721(["testNftAsset", "TNFT"]);

    const testBNFTImpl = await deployGenericBNFTImpl(false);

    await expect(bnftRegistry.upgradeBNFTWithImpl(testNftAsset.address, testBNFTImpl.address, [])).to.be.revertedWith(
      "BNFTR: asset nonexist"
    );
  });

  it("Update the generic BNFT implement and create new BNFT", async () => {
    const { bnftRegistry, bayc } = testEnv;

    const testNftAsset = await deployMintableERC721(["testNftAsset", "TNFT"]);

    const testBNFTImplNew = await deployGenericBNFTImpl(false);
    await bnftRegistry.setBNFTGenericImpl(testBNFTImplNew.address);

    await waitForTx(await bnftRegistry.createBNFT(testNftAsset.address));

    const nftAddrByAddr = await bnftRegistry.getBNFTAddresses(testNftAsset.address);
    expect(nftAddrByAddr).to.not.equal(undefined);
    expect(nftAddrByAddr.bNftProxy).to.not.equal(undefined);
    expect(nftAddrByAddr.bNftImpl).to.not.equal(undefined);
    expect(nftAddrByAddr.bNftProxy).to.not.equal(ZERO_ADDRESS);
    expect(nftAddrByAddr.bNftImpl).to.not.equal(ZERO_ADDRESS);
    expect(nftAddrByAddr.bNftProxy).to.not.equal(nftAddrByAddr.bNftImpl);
    expect(nftAddrByAddr.bNftImpl).to.be.equal(testBNFTImplNew.address);
  });

  it("Add custom symbols to special NFTs", async () => {
    const { bnftRegistry, bayc } = testEnv;

    const testNftAsset = await deployMintableERC721(["testNftAsset", "TNFT"]);

    await waitForTx(await bnftRegistry.addCustomeSymbols([testNftAsset.address], ["CTNFT"]));

    const testBNFTImplNew = await deployGenericBNFTImpl(false);
    await bnftRegistry.setBNFTGenericImpl(testBNFTImplNew.address);

    await waitForTx(await bnftRegistry.createBNFT(testNftAsset.address));

    const nftAddrByAddr = await bnftRegistry.getBNFTAddresses(testNftAsset.address);
    const bnftTest = await getBNFT(nftAddrByAddr.bNftProxy);

    const wantSymbol = (await bnftRegistry.symbolPrefix()) + "CTNFT";
    expect(wantSymbol).to.equal(await bnftTest.symbol());

    const wantName = (await bnftRegistry.namePrefix()) + " " + "CTNFT";
    expect(wantName).to.equal(await bnftTest.name());
  });

  it("Manage claim admin", async () => {
    const { bnftRegistry, users } = testEnv;
    const claimAdmin = users[5];

    const oldAdmin = await bnftRegistry.claimAdmin();

    await waitForTx(await bnftRegistry.setClaimAdmin(claimAdmin.address));
    const newAdmin = await bnftRegistry.claimAdmin();
    expect(newAdmin).to.equal(claimAdmin.address);

    await waitForTx(await bnftRegistry.setClaimAdmin(oldAdmin));
  });

  it("Manage delegate cash contract without permission (revert expect)", async () => {
    const { bnftRegistry, users } = testEnv;
    const user5 = users[5];

    const delegateCash = await new MockDelegationRegistryFactory(await getDeploySigner()).deploy();

    await expect(bnftRegistry.connect(user5.signer).setDelegateCashContract(delegateCash.address)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  it("Manage delegate cash contract", async () => {
    const { bnftRegistry, users } = testEnv;

    const delegateCash = await new MockDelegationRegistryFactory(await getDeploySigner()).deploy();

    await waitForTx(await bnftRegistry.setDelegateCashContract(delegateCash.address));
    const newContract = await bnftRegistry.getDelegateCashContract();
    expect(newContract).to.equal(delegateCash.address);
  });

  it("Manage delegate cash contract v2 without permission (revert expect)", async () => {
    const { bnftRegistry, users } = testEnv;
    const user5 = users[5];

    const delegateCashV2 = await new MockDelegationRegistryV2Factory(await getDeploySigner()).deploy();

    await expect(bnftRegistry.connect(user5.signer).setDelegateCashContract(delegateCashV2.address)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  it("Manage delegate cash contract v2", async () => {
    const { bnftRegistry, users } = testEnv;

    const delegateCashV2 = await new MockDelegationRegistryV2Factory(await getDeploySigner()).deploy();

    await waitForTx(await bnftRegistry.setDelegateCashContract(delegateCashV2.address));
    const newContract = await bnftRegistry.getDelegateCashContract();
    expect(newContract).to.equal(delegateCashV2.address);
  });
});
