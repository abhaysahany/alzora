import { expect } from "chai";
import { network } from "hardhat";

describe("3-Tier Decoupling Test: Binary + Global Affiliate + Personal Club", function () {
  it("Verifies Binary Matching, Global 20-Level Affiliate, Personal Team Club Progression & Spillover", async function () {
    const { ethers } = await network.create();

    const [deployer, root, sponsor, userA, userB, userC, treasury] = await ethers.getSigners();

    // Deploy 18-decimal Test USDT
    const mockUSDT = (await ethers.deployContract("TestToken")) as any;
    const usdtAddr = await mockUSDT.getAddress();

    // Deploy ElzoraMain implementation & proxy
    const impl = (await ethers.deployContract("ElzoraMain")) as any;

    const initData = impl.interface.encodeFunctionData("initialize", [
      deployer.address,
      usdtAddr,
      treasury.address,
      root.address,
    ]);
    const proxy = (await ethers.deployContract("ElzoraProxy", [
      await impl.getAddress(),
      initData,
    ])) as any;

    const elzora = (await ethers.getContractAt("ElzoraMain", await proxy.getAddress())) as any;
    const tokenUnit = await elzora.tokenUnit();

    // Configure Club Ranks:
    // Rank 0 (Starter): 2 members, netProfit $10, upgrade $14
    // Rank 1 (Leader): 4 members, netProfit $26, upgrade $30
    await elzora.connect(deployer).setClubRank(0, "Starter", 2, 24, 14, 0, 10);
    await elzora.connect(deployer).setClubRank(1, "Leader", 4, 56, 30, 0, 26);

    // Mint USDT to users and approve
    const mintAmount = ethers.parseUnits("1000", 18);
    for (const signer of [sponsor, userA, userB, userC]) {
      await mockUSDT.mint(signer.address, mintAmount);
      await mockUSDT.connect(signer).approve(await elzora.getAddress(), ethers.MaxUint256);
    }

    // -------------------------------------------------------------
    // Step 1: Register sponsor under root (Left)
    // -------------------------------------------------------------
    await elzora.connect(sponsor).register(root.address, root.address, 1);
    const sponsorProfile = await elzora.getUser(sponsor.address);
    expect(sponsorProfile.isRegistered).to.be.true;
    expect(sponsorProfile.parent).to.equal(root.address);
    expect(sponsorProfile.position).to.equal(1); // Left

    // -------------------------------------------------------------
    // Step 2: Sponsor registers userA on LEFT (position 1)
    // -------------------------------------------------------------
    await elzora.connect(userA).register(sponsor.address, sponsor.address, 1);
    const userAProfile = await elzora.getUser(userA.address);
    expect(userAProfile.parent).to.equal(sponsor.address);
    expect(userAProfile.position).to.equal(1); // Left

    let spUser = await elzora.getUser(sponsor.address);
    expect(spUser.leftChild).to.equal(userA.address);
    expect(spUser.leftDirectCount).to.equal(1n);
    expect(spUser.leftCarryVolume).to.equal(1n);
    expect(spUser.rightCarryVolume).to.equal(0n);
    // Personal Club progress for sponsor: 1 / 2 members
    expect(await elzora.userClubProgress(sponsor.address, 0)).to.equal(1n);
    expect(await elzora.userRankCompleted(sponsor.address, 0)).to.be.false;

    // -------------------------------------------------------------
    // Step 3: Sponsor registers userB on RIGHT (position 2)
    // -> Triggers 1:1 BINARY MATCH ($2.00)
    // -> Completes PERSONAL STARTER CLUB (2/2) -> $10.00 Net Profit!
    // -> Advances Sponsor to Leader Club (Rank 2)!
    // -------------------------------------------------------------
    const balBefore = await mockUSDT.balanceOf(sponsor.address);
    await elzora.connect(userB).register(sponsor.address, sponsor.address, 2);
    const userBProfile = await elzora.getUser(userB.address);
    expect(userBProfile.parent).to.equal(sponsor.address);
    expect(userBProfile.position).to.equal(2); // Right

    spUser = await elzora.getUser(sponsor.address);
    expect(spUser.rightChild).to.equal(userB.address);
    expect(spUser.rightDirectCount).to.equal(1n);
    // 1:1 pair consumed: carry volumes reset to 0
    expect(spUser.leftCarryVolume).to.equal(0n);
    expect(spUser.rightCarryVolume).to.equal(0n);

    // Personal Club: 2/2 completed!
    expect(await elzora.userClubProgress(sponsor.address, 0)).to.equal(2n);
    expect(await elzora.userRankCompleted(sponsor.address, 0)).to.be.true;
    // Current rank advanced to 2 (Leader)
    expect(spUser.currentRank).to.equal(2n);

    // Verify Sponsor received:
    // +$10.00 Direct income (from userB)
    // +$2.00 Binary matching (1 pair)
    // +$10.00 Starter Club Net Profit (personal club completion)
    // +$0.40 Global Affiliate matrix income (level 1 from userB)
    // Total = $22.40 USDT
    const balAfter = await mockUSDT.balanceOf(sponsor.address);
    expect(balAfter - balBefore).to.equal((224n * tokenUnit) / 10n);

    const inc = await elzora.getIncomeBreakdown(sponsor.address);
    expect(inc.matchingIncome).to.equal(2n * tokenUnit);
    expect(inc.directIncome).to.equal(20n * tokenUnit); // $10 from userA + $10 from userB
    expect(inc.clubIncome).to.equal(10n * tokenUnit); // $10 Starter Club profit
    expect(inc.affiliateIncome).to.equal((40n * tokenUnit) / 100n); // $0.40 Global Affiliate

    // -------------------------------------------------------------
    // Step 4: Sponsor registers userC on LEFT again
    // -> PERSONAL SPILLOVER: Spills down under userA (inside sponsor's team)!
    // -> userA's Personal Starter Club gets 1st member (1/2)!
    // -> userC never goes to a global stranger!
    // -------------------------------------------------------------
    await elzora.connect(userC).register(sponsor.address, sponsor.address, 1);
    const userCProfile = await elzora.getUser(userC.address);
    // userC is placed under userA!
    expect(userCProfile.parent).to.equal(userA.address);
    expect(userCProfile.position).to.equal(1); // Left

    const userANode = await elzora.getUser(userA.address);
    expect(userANode.leftChild).to.equal(userC.address);

    // userA gets the Starter Club credit (1/2) in personal team!
    expect(await elzora.userClubProgress(userA.address, 0)).to.equal(1n);

    // Sponsor's binary volume: carries forward 1 on left!
    spUser = await elzora.getUser(sponsor.address);
    expect(spUser.leftCarryVolume).to.equal(1n);
    expect(spUser.rightCarryVolume).to.equal(0n);

    // -------------------------------------------------------------
    // Step 5: Test Overpaid Deduction & Backlog Income Issuance
    // -------------------------------------------------------------
    // Admin sets $5 pending deduction for sponsor
    await elzora.connect(deployer).setPendingIncomeDeduction(sponsor.address, 5n * tokenUnit);
    expect(await elzora.pendingIncomeDeduction(sponsor.address)).to.equal(5n * tokenUnit);

    // Admin issues backlog binary income (2 pairs = $4)
    // 100% should be withheld towards deduction!
    const balBeforeBacklog = await mockUSDT.balanceOf(sponsor.address);
    await elzora.connect(deployer).issueBacklogBinaryIncome(sponsor.address, 2);
    const balAfterBacklog = await mockUSDT.balanceOf(sponsor.address);
    expect(balAfterBacklog - balBeforeBacklog).to.equal(0n);

    // Remaining deduction is now $1
    expect(await elzora.pendingIncomeDeduction(sponsor.address)).to.equal(1n * tokenUnit);

    console.log("3-TIER ARCHITECTURE VERIFIED: 100% SUCCESS!");
  });
});
