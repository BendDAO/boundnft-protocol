import { TestEnv, makeSuite } from "./helpers/make-suite";
import { deployMockBNFTMinter } from "../helpers/contracts-deployments";
import { CommonsConfig } from "../configs/commons";
import { MockBNFTMinter, MockDelegationRegistryV2, MockDelegationRegistryV2Factory } from "../types";
import { waitForTx } from "../helpers/misc-utils";
import { ZERO_ADDRESS } from "../helpers/constants";
import { getBNFT, getDeploySigner } from "../helpers/contracts-getters";
import { arrayify } from "ethers/lib/utils";

const { expect } = require("chai");

makeSuite("BNFT: Delegate Cash V2 with Rights", (testEnv: TestEnv) => {
  let mockDelegateCashV2: MockDelegationRegistryV2;
  let mockMinterInstance: MockBNFTMinter;

  let cachedTokenId1: string;
  let cachedTokenId2: string;
  let testRights: Uint8Array;

  before(async () => {
    testRights = arrayify("0x000000000000000000000000000000000000000000000000000000ffffffffff");

    mockDelegateCashV2 = await new MockDelegationRegistryV2Factory(await getDeploySigner()).deploy();
    await testEnv.bnftRegistry.connect(await getDeploySigner()).setDelegateCashContractV2(mockDelegateCashV2.address);
    mockMinterInstance = await deployMockBNFTMinter([testEnv.bayc.address, testEnv.bBAYC.address]);

    testEnv.tokenIdTracker++;
    cachedTokenId1 = testEnv.tokenIdTracker.toString();
    await testEnv.bayc.connect(testEnv.users[0].signer).mint(cachedTokenId1);

    testEnv.tokenIdTracker++;
    cachedTokenId2 = testEnv.tokenIdTracker.toString();
    await testEnv.bayc.connect(testEnv.users[0].signer).mint(cachedTokenId2);

    await testEnv.bayc.connect(testEnv.users[0].signer).setApprovalForAll(mockMinterInstance.address, true);
    await mockMinterInstance.connect(testEnv.users[0].signer).mint(testEnv.users[0].address, cachedTokenId1);
    await mockMinterInstance.connect(testEnv.users[0].signer).mint(testEnv.users[0].address, cachedTokenId2);
  });

  it("Failed to set delegate cash for tokens not owner (revert expect)", async () => {
    const { bBAYC, users } = testEnv;
    const user5 = users[5];

    await expect(
      bBAYC
        .connect(user5.signer)
        ["setDelegateCashForTokenV2WithRights(uint256[],bytes32,bool)"]([cachedTokenId1], testRights, true)
    ).to.be.revertedWith("BNFT: caller is not owner");
  });

  it("Successful to set delegate cash for tokens", async () => {
    const { bBAYC, users } = testEnv;
    const user0 = users[0];
    const user1 = users[1];
    const user2 = users[2];

    // user0 and user2 for token 1
    await waitForTx(
      await bBAYC
        .connect(user0.signer)
        ["setDelegateCashForTokenV2WithRights(uint256[],bytes32,bool)"]([cachedTokenId1], testRights, true)
    );
    await waitForTx(
      await bBAYC
        .connect(user0.signer)
        ["setDelegateCashForTokenV2WithRights(address,uint256[],bytes32,bool)"](
          user2.address,
          [cachedTokenId1],
          testRights,
          true
        )
    );

    // user1 and user2 for token 2
    await waitForTx(
      await bBAYC
        .connect(user0.signer)
        ["setDelegateCashForTokenV2WithRights(address,uint256[],bytes32,bool)"](
          user1.address,
          [cachedTokenId2],
          testRights,
          true
        )
    );
    await waitForTx(
      await bBAYC
        .connect(user0.signer)
        ["setDelegateCashForTokenV2WithRights(address,uint256[],bytes32,bool)"](
          user2.address,
          [cachedTokenId2],
          testRights,
          true
        )
    );

    const { delegateAddrs } = await bBAYC.getDelegateCashForTokenV2([cachedTokenId1, cachedTokenId2]);
    const delegateAddrs1 = delegateAddrs[0];
    const delegateAddrs2 = delegateAddrs[1];
    expect(delegateAddrs1.length).to.be.equal(2);
    expect(delegateAddrs1[0]).to.be.equal(user0.address);
    expect(delegateAddrs2[1]).to.be.equal(user2.address);

    expect(delegateAddrs2.length).to.be.equal(2);
    expect(delegateAddrs2[0]).to.be.equal(user1.address);
    expect(delegateAddrs2[1]).to.be.equal(user2.address);
  });

  it("Successful to unset delegate cash for tokens", async () => {
    const { bBAYC, users } = testEnv;
    const user0 = users[0];
    const user1 = users[1];
    const user2 = users[2];

    // user0 for token 1
    await waitForTx(
      await bBAYC
        .connect(user0.signer)
        ["setDelegateCashForTokenV2WithRights(uint256[],bytes32,bool)"]([cachedTokenId1], testRights, false)
    );
    // user2 for token 2
    await waitForTx(
      await bBAYC
        .connect(user0.signer)
        ["setDelegateCashForTokenV2WithRights(address,uint256[],bytes32,bool)"](
          user2.address,
          [cachedTokenId2],
          testRights,
          false
        )
    );

    const { delegateAddrs } = await bBAYC.getDelegateCashForTokenV2([cachedTokenId1, cachedTokenId2]);
    const delegateAddrs1 = delegateAddrs[0];
    const delegateAddrs2 = delegateAddrs[1];

    expect(delegateAddrs1.length).to.be.equal(1);
    expect(delegateAddrs1[0]).to.be.equal(user2.address);

    expect(delegateAddrs2.length).to.be.equal(1);
    expect(delegateAddrs2[0]).to.be.equal(user1.address);
  });

  it("Don't remove delegate cash when burn", async () => {
    const { bBAYC, users } = testEnv;
    const user0 = users[0];
    const user1 = users[1];
    const user2 = users[2];

    await waitForTx(
      await bBAYC
        .connect(user0.signer)
        ["setDelegateCashForTokenV2WithRights(address,uint256[],bytes32,bool)"](
          user2.address,
          [cachedTokenId2],
          testRights,
          true
        )
    );
    await waitForTx(await mockMinterInstance.connect(user0.signer).burn(cachedTokenId2));

    const { delegateAddrs } = await bBAYC.getDelegateCashForTokenV2([cachedTokenId1, cachedTokenId2]);
    const delegateAddrs1 = delegateAddrs[0];
    const delegateAddrs2 = delegateAddrs[1];

    expect(delegateAddrs1.length).to.be.equal(1);
    expect(delegateAddrs1[0]).to.be.equal(user2.address);

    expect(delegateAddrs2.length).to.be.equal(2);
    expect(delegateAddrs2[0]).to.be.equal(user1.address);
    expect(delegateAddrs2[1]).to.be.equal(user2.address);
  });

  it("Get same delegate cash when mint again", async () => {
    const { bBAYC, users } = testEnv;
    const user0 = users[0];
    const user1 = users[1];
    const user2 = users[2];

    await waitForTx(
      await mockMinterInstance.connect(testEnv.users[0].signer).mint(testEnv.users[0].address, cachedTokenId2)
    );

    const { delegateAddrs } = await bBAYC.getDelegateCashForTokenV2([cachedTokenId1, cachedTokenId2]);
    const delegateAddrs2 = delegateAddrs[1];

    expect(delegateAddrs2.length).to.be.equal(2);
    expect(delegateAddrs2[0]).to.be.equal(user1.address);
    expect(delegateAddrs2[1]).to.be.equal(user2.address);
  });
});
