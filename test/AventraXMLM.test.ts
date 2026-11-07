// @ts-nocheck
import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

describe.skip("AventraXMLM - 100% PDF Business Plan Suite", function () {
  async function deployMLMFixture() {
    const [admin, root, treasuryWallet, userA, userB, userC, userD, userE, attacker] = await ethers.getSigners();

    // Deploy Mock USDT Payment Token
    const mockUSDT = await ethers.deployContract("AventraToken", [admin.address]);

    // Deploy AVX Token (AventraX Coin)
    const avxToken = await ethers.deployContract("AventraToken", [admin.address]);

    // Deploy AventraXMLM Implementation & Proxy
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

    const xmlM = await ethers.getContractAt("AventraXMLM", await proxy.getAddress());

    // Transfer initial USDT & AVX liquidity to contract for swaps/withdrawals
    await mockUSDT.connect(admin).transfer(await xmlM.getAddress(), ethers.parseEther("100000"));
    await avxToken.connect(admin).transfer(await xmlM.getAddress(), ethers.parseEther("1000000"));

    const initialMint = ethers.parseEther("10000");
    await mockUSDT.connect(admin).transfer(userA.address, initialMint);
    await mockUSDT.connect(admin).transfer(userB.address, initialMint);
    await mockUSDT.connect(admin).transfer(userC.address, initialMint);
    await mockUSDT.connect(admin).transfer(userD.address, initialMint);
    await mockUSDT.connect(admin).transfer(userE.address, initialMint);

    const pkgAmount = ethers.parseEther("100");

    return { xmlM, mockUSDT, avxToken, admin, root, treasuryWallet, userA, userB, userC, userD, userE, attacker, pkgAmount };
  }

  describe("Initialization & System Parameters", function () {
    it("should initialize payment token, AVX token, treasury wallet, and 20 levels", async function () {
      const { xmlM, mockUSDT, avxToken, treasuryWallet, root } = await networkHelpers.loadFixture(deployMLMFixture);
      expect(await xmlM.paymentToken()).to.equal(await mockUSDT.getAddress());
      expect(await xmlM.avxToken()).to.equal(await avxToken.getAddress());
      expect(await xmlM.treasuryWallet()).to.equal(treasuryWallet.address);
      expect(await xmlM.maxLevel()).to.equal(20n);
      expect(await xmlM.coinPriceUsd()).to.equal(ethers.parseEther("1.0"));
      expect(await xmlM.swapFeeBps()).to.equal(2100n); // 21%

      const rootMember = await xmlM.getMember(root.address);
      expect(rootMember.active).to.be.true;
    });

    it("should accurately return contract AVX and USDT balances via view functions", async function () {
      const { xmlM } = await networkHelpers.loadFixture(deployMLMFixture);
      expect(await xmlM.getContractUsdtBalance()).to.equal(ethers.parseEther("100000"));
      expect(await xmlM.getContractAvxBalance()).to.equal(ethers.parseEther("1000000"));
    });
  });

  describe("Member Registration", function () {
    it("should register new user under sponsor", async function () {
      const { xmlM, root, userA } = await networkHelpers.loadFixture(deployMLMFixture);
      await expect(xmlM.connect(userA).register(root.address))
        .to.emit(xmlM, "MemberRegistered");

      const memberA = await xmlM.getMember(userA.address);
      expect(memberA.sponsor).to.equal(root.address);
      expect(await xmlM.totalMembers()).to.equal(2n);
    });

    it("should revert if user sponsors self", async function () {
      const { xmlM, userA } = await networkHelpers.loadFixture(deployMLMFixture);
      await expect(
        xmlM.connect(userA).register(userA.address)
      ).to.be.revertedWithCustomError(xmlM, "CannotSponsorSelf");
    });

    it("should revert if sponsor is not active", async function () {
      const { xmlM, root, userA, userB } = await networkHelpers.loadFixture(deployMLMFixture);
      await xmlM.connect(userA).register(root.address); // userA is registered but NOT active
      await expect(
        xmlM.connect(userB).register(userA.address)
      ).to.be.revertedWithCustomError(xmlM, "SponsorNotActive");
    });
  });

  describe("Package Purchase & 3% Direct Income in AVX Tokens", function () {
    it("should purchase package and pay 3% Direct Income in AVX Tokens to sponsor", async function () {
      const { xmlM, mockUSDT, avxToken, root, userA, userB, pkgAmount } = await networkHelpers.loadFixture(deployMLMFixture);

      // User A buys package ($100), then User B registers under A and buys package ($100)
      await xmlM.connect(userA).register(root.address);
      await mockUSDT.connect(userA).approve(await xmlM.getAddress(), pkgAmount);
      await xmlM.connect(userA)["purchasePackage(uint256,uint256)"](1, pkgAmount);

      await xmlM.connect(userB).register(userA.address);
      await mockUSDT.connect(userB).approve(await xmlM.getAddress(), pkgAmount);

      const pendingBefore = await xmlM.userPendingTokens(userA.address);
      await expect(xmlM.connect(userB)["purchasePackage(uint256,uint256)"](1, pkgAmount))
        .to.emit(xmlM, "PackagePurchased")
        .withArgs(userB.address, 1n, pkgAmount);

      const pendingAfter = await xmlM.userPendingTokens(userA.address);
      // 3% of $100 = $3 = 3 AVX tokens accrued in pending vault
      const expectedDirectIncomeAvx = ethers.parseEther("3");
      expect(pendingAfter - pendingBefore).to.equal(expectedDirectIncomeAvx);
    });

    it("should allow custom investment within range and enforce min/max bounds", async function () {
      const { xmlM, mockUSDT, root, userA } = await networkHelpers.loadFixture(deployMLMFixture);
      await xmlM.connect(userA).register(root.address);

      // Try investing $5 in Package 1 (min is $10) -> should revert
      await mockUSDT.connect(userA).approve(await xmlM.getAddress(), ethers.parseEther("10000"));
      await expect(
        xmlM.connect(userA)["purchasePackage(uint256,uint256)"](1, ethers.parseEther("5"))
      ).to.be.revertedWithCustomError(xmlM, "OutsidePackageLimits");

      // Try investing $1000 in Package 1 (max is $999) -> should revert
      await expect(
        xmlM.connect(userA)["purchasePackage(uint256,uint256)"](1, ethers.parseEther("1000"))
      ).to.be.revertedWithCustomError(xmlM, "OutsidePackageLimits");

      // Invest valid $500 in Package 1 ($10 - $999)
      const customInvestP1 = ethers.parseEther("500");
      await expect(xmlM.connect(userA)["purchasePackage(uint256,uint256)"](1, customInvestP1))
        .to.emit(xmlM, "PackagePurchased")
        .withArgs(userA.address, 1n, customInvestP1);

      const member = await xmlM.getMember(userA.address);
      expect(member.packageAmount).to.equal(customInvestP1);
      expect(member.totalInvestment).to.equal(customInvestP1);
    });
  });

  describe("Daily Coin ROI & 2X Non-Working Cap (Pending Vault)", function () {
    it("should accrue Daily Coin ROI into pending vault and allow withdrawal", async function () {
      const { xmlM, mockUSDT, avxToken, root, userA, pkgAmount } = await networkHelpers.loadFixture(deployMLMFixture);

      await xmlM.connect(userA).register(root.address);
      await mockUSDT.connect(userA).approve(await xmlM.getAddress(), pkgAmount);
      await xmlM.connect(userA)["purchasePackage(uint256,uint256)"](1, pkgAmount); // $100 package -> 0.4% Daily ROI = $0.40/day

      // Advance time by 5 days (production interval: 1 days/ROI)
      await networkHelpers.time.increase(5 * 86400);

      await xmlM.connect(userA).claimDailyROI();

      // 5 days * $0.40 = 2 AVX Tokens ($2.00) in pending vault
      expect(await xmlM.userPendingTokens(userA.address)).to.equal(ethers.parseEther("2"));

      // Withdraw pending tokens to MetaMask wallet
      const balBefore = await avxToken.balanceOf(userA.address);
      await xmlM.connect(userA).withdrawPendingTokens(ethers.parseEther("2"));
      const balAfter = await avxToken.balanceOf(userA.address);

      expect(balAfter - balBefore).to.equal(ethers.parseEther("2"));
      expect(await xmlM.userPendingTokens(userA.address)).to.equal(0n);

      const splitInfo = await xmlM.getUserSplitCapInfo(userA.address);
      expect(splitInfo.nonWorkingIncomeUsd).to.equal(ethers.parseEther("2"));
      expect(splitInfo.nonWorkingCapUsd).to.equal(ethers.parseEther("200")); // 2X of $100
    });

    it("should allow a single user to hold all 3 packages simultaneously and claim combined daily ROI in one button", async function () {
      const { xmlM, mockUSDT, avxToken, root, userA } = await networkHelpers.loadFixture(deployMLMFixture);
      await xmlM.connect(userA).register(root.address);
      await mockUSDT.connect(userA).approve(await xmlM.getAddress(), ethers.parseEther("20000"));

      // User A buys Package 1 ($500 -> 0.4% = $2.00/day)
      await xmlM.connect(userA)["purchasePackage(uint256,uint256)"](1, ethers.parseEther("500"));
      // User A buys Package 2 ($2000 -> 0.6% = $12.00/day)
      await xmlM.connect(userA)["purchasePackage(uint256,uint256)"](2, ethers.parseEther("2000"));
      // User A buys Package 3 ($7000 -> 0.8% = $56.00/day)
      await xmlM.connect(userA)["purchasePackage(uint256,uint256)"](3, ethers.parseEther("7000"));

      // Total investment = $500 + $2000 + $7000 = $9500
      // Total daily ROI rate = $2.00 + $12.00 + $56.00 = $70.00 / day
      const activePackages = await xmlM.getUserActivePackages(userA.address);
      expect(activePackages.amounts[0]).to.equal(ethers.parseEther("500"));
      expect(activePackages.amounts[1]).to.equal(ethers.parseEther("2000"));
      expect(activePackages.amounts[2]).to.equal(ethers.parseEther("7000"));
      expect(activePackages.totalDailyUsd).to.equal(ethers.parseEther("70"));

      // Advance time by 3 days -> 3 days * $70/day = $210 (210 AVX)
      await networkHelpers.time.increase(3 * 86400);

      await xmlM.connect(userA).claimDailyROI();
      expect(await xmlM.userPendingTokens(userA.address)).to.equal(ethers.parseEther("210"));

      const balBefore = await avxToken.balanceOf(userA.address);
      await xmlM.connect(userA).withdrawPendingTokens(ethers.parseEther("210"));
      const balAfter = await avxToken.balanceOf(userA.address);

      expect(balAfter - balBefore).to.equal(ethers.parseEther("210"));

      // Check per-package cap info
      const p1Cap = await xmlM.getUserPackageCapInfo(userA.address, 1);
      expect(p1Cap.investedAmount).to.equal(ethers.parseEther("500"));
      expect(p1Cap.nonWorkingCap).to.equal(ethers.parseEther("1000")); // 2X of $500 = $1000
      expect(p1Cap.nonWorkingEarned).to.equal(ethers.parseEther("6")); // 3 days * $2 = $6
      expect(p1Cap.remainingCap).to.equal(ethers.parseEther("994"));
      expect(p1Cap.isCapped).to.be.false;

      const p2Cap = await xmlM.getUserPackageCapInfo(userA.address, 2);
      expect(p2Cap.investedAmount).to.equal(ethers.parseEther("2000"));
      expect(p2Cap.nonWorkingCap).to.equal(ethers.parseEther("4000")); // 2X of $2000 = $4000
      expect(p2Cap.nonWorkingEarned).to.equal(ethers.parseEther("36")); // 3 days * $12 = $36
      expect(p2Cap.remainingCap).to.equal(ethers.parseEther("3964"));
      expect(p2Cap.isCapped).to.be.false;

      const p3Cap = await xmlM.getUserPackageCapInfo(userA.address, 3);
      expect(p3Cap.investedAmount).to.equal(ethers.parseEther("7000"));
      expect(p3Cap.nonWorkingCap).to.equal(ethers.parseEther("14000")); // 2X of $7000 = $14000
      expect(p3Cap.nonWorkingEarned).to.equal(ethers.parseEther("168")); // 3 days * $56 = $168
      expect(p3Cap.remainingCap).to.equal(ethers.parseEther("13832"));
      expect(p3Cap.isCapped).to.be.false;
    });
  });

  describe("Level Unlocking Criteria & ROI-on-ROI Level Income", function () {
    it("should check direct referral count for level unlocking (1 Direct = 2 levels)", async function () {
      const { xmlM, mockUSDT, root, userA, userB, pkgAmount } = await networkHelpers.loadFixture(deployMLMFixture);

      await xmlM.connect(userA).register(root.address);
      await mockUSDT.connect(userA).approve(await xmlM.getAddress(), pkgAmount);
      await xmlM.connect(userA)["purchasePackage(uint256,uint256)"](1, pkgAmount);

      expect(await xmlM.isLevelUnlocked(userA.address, 1)).to.be.false;

      // User A sponsors User B -> A now has 1 direct
      await xmlM.connect(userB).register(userA.address);
      expect(await xmlM.isLevelUnlocked(userA.address, 1)).to.be.true;
      expect(await xmlM.isLevelUnlocked(userA.address, 2)).to.be.true;
      expect(await xmlM.isLevelUnlocked(userA.address, 3)).to.be.false;
    });

    it("should distribute ROI-on-ROI Level Income to pending vault when downline claims Daily ROI", async function () {
      const { xmlM, mockUSDT, avxToken, root, userA, userB, pkgAmount } = await networkHelpers.loadFixture(deployMLMFixture);

      // Root -> A (active) -> B (active)
      await xmlM.connect(userA).register(root.address);
      await mockUSDT.connect(userA).approve(await xmlM.getAddress(), pkgAmount);
      await xmlM.connect(userA)["purchasePackage(uint256,uint256)"](1, pkgAmount);

      await xmlM.connect(userB).register(userA.address);
      await mockUSDT.connect(userB).approve(await xmlM.getAddress(), pkgAmount);
      await xmlM.connect(userB)["purchasePackage(uint256,uint256)"](1, pkgAmount);

      // Advance time 10 days ($4.00 ROI for B at 0.4%/day for 10 days)
      await networkHelpers.time.increase(10 * 86400);

      // Direct income of $3 from userB purchase + Level 1 ROI of $0.40 from userB claim
      await xmlM.connect(userB).claimDailyROI();

      // B gets $4 ROI. Level 1 to A (10% of $4 = $0.40 = 0.4 AVX). Direct income = 3 AVX. Total pending for A = 3.4 AVX
      expect(await xmlM.userPendingTokens(userA.address)).to.equal(ethers.parseEther("3.4"));

      const balBeforeA = await avxToken.balanceOf(userA.address);
      await xmlM.connect(userA).withdrawPendingTokens(ethers.parseEther("3.4"));
      const balAfterA = await avxToken.balanceOf(userA.address);

      expect(balAfterA - balBeforeA).to.equal(ethers.parseEther("3.4"));
    });
  });

  describe("Pending Token Swap & Withdrawal Engine", function () {
    it("should swap pending AVX Tokens to USDT and deduct 21% fee to treasuryWallet", async function () {
      const { xmlM, mockUSDT, root, treasuryWallet, userA, pkgAmount } = await networkHelpers.loadFixture(deployMLMFixture);

      // User A buys package and claims Daily ROI to accrue pending tokens
      await xmlM.connect(userA).register(root.address);
      await mockUSDT.connect(userA).approve(await xmlM.getAddress(), pkgAmount);
      await xmlM.connect(userA)["purchasePackage(uint256,uint256)"](1, pkgAmount);

      // 25 days * $0.40/day = 10 AVX
      await networkHelpers.time.increase(25 * 86400);
      await xmlM.connect(userA).claimDailyROI();

      expect(await xmlM.userPendingTokens(userA.address)).to.equal(ethers.parseEther("10"));

      const swapAmount = ethers.parseEther("10"); // 10 AVX tokens = $10 USD
      const treasuryUsdtBefore = await mockUSDT.balanceOf(treasuryWallet.address);
      const userUsdtBefore = await mockUSDT.balanceOf(userA.address);

      await xmlM.connect(userA).swapPendingTokensToUSDT(swapAmount);

      const treasuryUsdtAfter = await mockUSDT.balanceOf(treasuryWallet.address);
      const userUsdtAfter = await mockUSDT.balanceOf(userA.address);

      // 21% of $10 = $2.10 to Treasury
      expect(treasuryUsdtAfter - treasuryUsdtBefore).to.equal(ethers.parseEther("2.1"));

      // 79% of $10 = $7.90 to User A
      expect(userUsdtAfter - userUsdtBefore).to.equal(ethers.parseEther("7.9"));
      expect(await xmlM.userPendingTokens(userA.address)).to.equal(0n);
    });
  });

  describe("Admin Setters & Access Control", function () {
    it("should allow admin to update treasuryWallet, coinPrice, and swapFee", async function () {
      const { xmlM, admin, userA } = await networkHelpers.loadFixture(deployMLMFixture);

      await xmlM.connect(admin).setTreasuryWallet(userA.address);
      expect(await xmlM.treasuryWallet()).to.equal(userA.address);

      await xmlM.connect(admin).setCoinPriceUsd(ethers.parseEther("2.0"));
      expect(await xmlM.coinPriceUsd()).to.equal(ethers.parseEther("2.0"));

      await xmlM.connect(admin).setSwapFeeBps(1500); // 15%
      expect(await xmlM.swapFeeBps()).to.equal(1500n);
    });

    it("should perform 2-step safe ownership transfer correctly", async function () {
      const { xmlM, admin, userA } = await networkHelpers.loadFixture(deployMLMFixture);

      // Step 1: Admin nominates userA as pending owner
      await expect(xmlM.connect(admin).transferOwnership(userA.address))
        .to.emit(xmlM, "OwnershipTransferStarted")
        .withArgs(admin.address, userA.address);

      expect(await xmlM.pendingOwner()).to.equal(userA.address);
      expect(await xmlM.ownerAddress()).to.equal(admin.address);

      // Non-pending owner trying to accept should revert
      await expect(xmlM.connect(admin).acceptOwnership()).to.be.revertedWithCustomError(xmlM, "UnauthorizedCaller");

      // Step 2: Nominated userA accepts ownership
      await expect(xmlM.connect(userA).acceptOwnership())
        .to.emit(xmlM, "OwnershipTransferred")
        .withArgs(admin.address, userA.address);

      expect(await xmlM.ownerAddress()).to.equal(userA.address);
      expect(await xmlM.pendingOwner()).to.equal(ethers.ZeroAddress);

      // Check that userA is now Admin and old admin lost role
      const defaultAdminRole = await xmlM.DEFAULT_ADMIN_ROLE();
      expect(await xmlM.hasRole(defaultAdminRole, userA.address)).to.be.true;
      expect(await xmlM.hasRole(defaultAdminRole, admin.address)).to.be.false;
    });

    it("should allow admin to cancel pending ownership transfer before acceptance", async function () {
      const { xmlM, admin, userA } = await networkHelpers.loadFixture(deployMLMFixture);

      await xmlM.connect(admin).transferOwnership(userA.address);
      expect(await xmlM.pendingOwner()).to.equal(userA.address);

      await xmlM.connect(admin).cancelOwnershipTransfer();
      expect(await xmlM.pendingOwner()).to.equal(ethers.ZeroAddress);

      // userA can no longer accept
      await expect(xmlM.connect(userA).acceptOwnership()).to.be.revertedWithCustomError(xmlM, "UnauthorizedCaller");
    });
  });
});
