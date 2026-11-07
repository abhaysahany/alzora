// @ts-nocheck
import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

describe.skip("AventraGateway - Read-Only DApp Interface", function () {
  async function deployGatewayFixture() {
    const [admin, root, treasuryWallet, userA, userB, userC, userD] =
      await ethers.getSigners();

    // Deploy USDT Payment Token
    const mockUSDT = await ethers.deployContract("AventraToken", [
      admin.address,
    ]);

    // Deploy AVX Token
    const avxToken = await ethers.deployContract("AventraToken", [
      admin.address,
    ]);

    // Deploy AventraXMLM via Proxy
    const xmlMImpl = await ethers.deployContract("AventraXMLM");
    const initData = xmlMImpl.interface.encodeFunctionData("initialize", [
      admin.address,
      await mockUSDT.getAddress(),
      await avxToken.getAddress(),
      root.address,
      treasuryWallet.address,
    ]);

    const proxy = await ethers.deployContract("AventraProxy", [
      await xmlMImpl.getAddress(),
      initData,
    ]);

    const xmlM = await ethers.getContractAt(
      "AventraXMLM",
      await proxy.getAddress()
    );

    // Transfer initial AVX liquidity to contract for withdrawals
    await avxToken.connect(admin).transfer(await xmlM.getAddress(), ethers.parseEther("1000000"));

    const gateway = await ethers.deployContract("AventraGateway", [
      await xmlM.getAddress(),
      await avxToken.getAddress(),
    ]);

    // Setup package $100
    const pkgAmount = ethers.parseEther("100");

    // Register and activate root -> A -> B -> C & D
    await xmlM.connect(userA).register(root.address);
    await mockUSDT.connect(admin).transfer(userA.address, pkgAmount);
    await mockUSDT.connect(userA).approve(await xmlM.getAddress(), pkgAmount);
    await xmlM.connect(userA)["purchasePackage(uint256,uint256)"](1, pkgAmount);

    await xmlM.connect(userB).register(userA.address);
    await mockUSDT.connect(admin).transfer(userB.address, pkgAmount);
    await mockUSDT.connect(userB).approve(await xmlM.getAddress(), pkgAmount);
    await xmlM.connect(userB)["purchasePackage(uint256,uint256)"](1, pkgAmount);

    await xmlM.connect(userC).register(userB.address);
    await xmlM.connect(userD).register(userB.address);

    return {
      gateway,
      xmlM,
      mockUSDT,
      avxToken,
      root,
      userA,
      userB,
      userC,
      userD,
      pkgAmount,
    };
  }

  it("should query member info and sponsor address accurately", async function () {
    const { gateway, root, userA, userB } = await networkHelpers.loadFixture(
      deployGatewayFixture
    );

    expect(await gateway.getSponsor(userA.address)).to.equal(root.address);
    expect(await gateway.getSponsor(userB.address)).to.equal(userA.address);

    const memberA = await gateway.getMember(userA.address);
    expect(memberA.active).to.be.true;
    expect(memberA.packageId).to.equal(1n);
  });

  it("should query contract AVX and USDT balances via Gateway view functions", async function () {
    const { gateway, xmlM, mockUSDT, avxToken } = await networkHelpers.loadFixture(
      deployGatewayFixture
    );

    const avxBal = await avxToken.balanceOf(await xmlM.getAddress());
    const usdtBal = await mockUSDT.balanceOf(await xmlM.getAddress());

    expect(await gateway.getContractAvxBalance()).to.equal(avxBal);
    expect(await gateway.getContractUsdtBalance()).to.equal(usdtBal);
  });

  it("should query user statistics and legacy 5X total cap metrics accurately", async function () {
    const { gateway, userA, pkgAmount } = await networkHelpers.loadFixture(
      deployGatewayFixture
    );

    const stats = await gateway.getUserStatistics(userA.address);
    expect(stats.totalInvestment).to.equal(pkgAmount);
    expect(stats.maxEligibleIncome).to.equal(ethers.parseEther("500")); // 5X Total Cap
    expect(stats.remainingCap).to.equal(ethers.parseEther("497")); // $500 - $3 direct income
    expect(stats.directReferralsCount).to.equal(1n); // userB
    expect(stats.active).to.be.true;
  });

  it("should query comprehensive user full profile & cap details", async function () {
    const { gateway, userA, pkgAmount } = await networkHelpers.loadFixture(
      deployGatewayFixture
    );

    const profile = await gateway.getUserFullProfile(userA.address);
    expect(profile.userId).to.equal(2n);
    expect(profile.userAddress).to.equal(userA.address);
    expect(profile.active).to.be.true;
    expect(profile.totalInvestmentUsd).to.equal(pkgAmount);
    expect(profile.directReferralsCount).to.equal(1n);
    expect(profile.unlockedLevels).to.equal(2n); // 1 direct = 2 levels
    expect(profile.directIncomeUsd).to.equal(ethers.parseEther("3")); // 3% of $100
    expect(profile.totalIncomeUsd).to.equal(ethers.parseEther("3"));
    expect(profile.nonWorkingCapUsd).to.equal(ethers.parseEther("200")); // 2X
    expect(profile.workingCapUsd).to.equal(ethers.parseEther("300")); // 3X
    expect(profile.totalCombinedCapUsd).to.equal(ethers.parseEther("500")); // 5X
    expect(profile.remainingCapUsd).to.equal(ethers.parseEther("497"));
    expect(profile.isCappedOut).to.be.false;

    const profileById = await gateway.getUserProfileById(2n);
    expect(profileById.userAddress).to.equal(userA.address);

    const capDetails = await gateway.getUserCapDetails(userA.address);
    expect(capDetails.totalInvestmentUsd).to.equal(pkgAmount);
    expect(capDetails.nonWorkingCapUsd).to.equal(ethers.parseEther("200"));
    expect(capDetails.workingCapUsd).to.equal(ethers.parseEther("300"));
    expect(capDetails.totalCombinedCapUsd).to.equal(ethers.parseEther("500"));
    expect(capDetails.remainingCapUsd).to.equal(ethers.parseEther("497"));
    expect(capDetails.isCappedOut).to.be.false;

    const incomeBreakdown = await gateway.getUserIncomeBreakdown(userA.address);
    expect(incomeBreakdown.directIncomeUsd).to.equal(ethers.parseEther("3"));
    expect(incomeBreakdown.totalIncomeUsd).to.equal(ethers.parseEther("3"));
  });

  it("should query paginated level members across the sponsor tree", async function () {
    const { gateway, userA, userB, userC, userD } =
      await networkHelpers.loadFixture(deployGatewayFixture);

    // Level 1 of userA -> userB
    const [l1Members, l1Total] = await gateway.getLevelMembers(
      userA.address,
      1,
      0,
      10
    );
    expect(l1Total).to.equal(1n);
    expect(l1Members).to.deep.equal([userB.address]);

    // Level 2 of userA -> userC & userD
    const [l2Members, l2Total] = await gateway.getLevelMembers(
      userA.address,
      2,
      0,
      10
    );
    expect(l2Total).to.equal(2n);
    expect(l2Members).to.deep.equal([userC.address, userD.address]);

    // Paginated query for Level 2 (limit 1, offset 1)
    const [l2Paged, l2PagedTotal] = await gateway.getLevelMembers(
      userA.address,
      2,
      1,
      1
    );
    expect(l2PagedTotal).to.equal(2n);
    expect(l2Paged).to.deep.equal([userD.address]);
  });

  it("should query aggregated global protocol statistics without private treasury/fees", async function () {
    const { gateway } = await networkHelpers.loadFixture(deployGatewayFixture);

    const globalStats = await gateway.getGlobalStatistics();
    expect(globalStats.totalMembers).to.equal(5n); // root + userA + userB + userC + userD
    expect(globalStats.totalActiveMembers).to.equal(3n); // root + userA + userB
    expect(globalStats.totalPackagePurchasesUsd).to.equal(
      ethers.parseEther("200")
    ); // $100 + $100
    expect(globalStats.totalDirectBonusDistributedUsd).to.equal(
      ethers.parseEther("3")
    ); // userA $3 (root had $0 package, so retained)
    expect(globalStats.totalIncomeDistributedUsd).to.equal(
      ethers.parseEther("3")
    );
    expect(globalStats.currentCoinPriceUsd).to.equal(ethers.parseEther("1")); // default $1.00
  });
});
