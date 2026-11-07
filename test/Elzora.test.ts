import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

describe("ELZORA Smart Contracts - Comprehensive System Test Suite", function () {
  async function deployElzoraFixture() {
    const signers = await ethers.getSigners();
    const [deployer, root, treasury, user1, user2, user3, user4, user5, user6, user7, user8, user9, attacker] = signers;

    // Deploy 6-decimal Test USDT ($50 = 50_000_000)
    const mockUSDT = (await ethers.deployContract("TestToken")) as any;

    // Deploy Implementation & ERC1967 Proxy
    const impl = await ethers.deployContract("ElzoraMain");
    const initData = impl.interface.encodeFunctionData("initialize", [
      deployer.address,
      await mockUSDT.getAddress(),
      treasury.address,
      root.address,
    ]);

    const proxy = await ethers.deployContract("ElzoraProxy", [
      await impl.getAddress(),
      initData,
    ]);

    const elzoraMain = (await ethers.getContractAt(
      "ElzoraMain",
      await proxy.getAddress()
    )) as any;

    // Deploy ElzoraGateway
    const elzoraGateway = (await ethers.deployContract("ElzoraGateway", [
      await elzoraMain.getAddress(),
    ])) as any;

    // Authorize Gateway in ElzoraMain
    await elzoraMain.connect(deployer).setGatewayContract(await elzoraGateway.getAddress());

    // Mint USDT and approve contracts for all signers
    const initialMint = ethers.parseUnits("50000", 6); // 50,000 USDT each
    for (const s of signers) {
      await mockUSDT.mint(s.address, initialMint);
      await mockUSDT.connect(s).approve(await elzoraMain.getAddress(), ethers.MaxUint256);
      await mockUSDT.connect(s).approve(await elzoraGateway.getAddress(), ethers.MaxUint256);
    }

    return {
      deployer,
      root,
      treasury,
      user1,
      user2,
      user3,
      user4,
      user5,
      user6,
      user7,
      user8,
      user9,
      attacker,
      signers,
      mockUSDT,
      elzoraMain,
      elzoraGateway,
    };
  }

  describe("1. Deployment & Protocol Initialization", function () {
    it("should initialize with correct token, decimals, and root configuration", async function () {
      const { elzoraMain, elzoraGateway, mockUSDT, root, treasury } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      expect(await elzoraMain.paymentToken()).to.equal(await mockUSDT.getAddress());
      expect(await elzoraMain.treasuryWallet()).to.equal(treasury.address);
      expect(await elzoraMain.rootAddress()).to.equal(root.address);
      expect(await elzoraMain.tokenUnit()).to.equal(ethers.parseUnits("1", 6));

      const rootProfile = await elzoraMain.getUser(root.address);
      expect(rootProfile.isRegistered).to.be.true;
      expect(rootProfile.currentRank).to.equal(1n);

      const stats = await elzoraGateway.getProtocolOverview();
      expect(stats.totalUsers).to.equal(1n);
      expect(stats.isSolvent).to.be.true;
    });
  });

  describe("2. Binary Placement & Registration Validation", function () {
    it("should register new user on Left position and deduce $50 USDT", async function () {
      const { elzoraMain, mockUSDT, root, user1 } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      const balBefore = await mockUSDT.balanceOf(user1.address);
      const regCost = ethers.parseUnits("50", 6);

      await expect(elzoraMain.connect(user1).register(root.address, root.address, 1)) // 1 = Left
        .to.emit(elzoraMain, "UserRegistered")
        .withArgs(user1.address, root.address, root.address, 1, (val: any) => val > 0);

      const balAfter = await mockUSDT.balanceOf(user1.address);
      expect(balBefore - balAfter).to.equal(regCost);

      const u1 = await elzoraMain.getUser(user1.address);
      expect(u1.isRegistered).to.be.true;
      expect(u1.sponsor).to.equal(root.address);
      expect(u1.parent).to.equal(root.address);

      const r = await elzoraMain.getUser(root.address);
      expect(r.leftChild).to.equal(user1.address);
      expect(r.leftTeamCount).to.equal(1n);
      expect(r.leftDirectCount).to.equal(1n);
      expect(r.directCount).to.equal(1n);
    });

    it("should register second user on Right position under root", async function () {
      const { elzoraMain, root, user1, user2 } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      await elzoraMain.connect(user1).register(root.address, root.address, 1); // Left
      await elzoraMain.connect(user2).register(root.address, root.address, 2); // Right

      const r = await elzoraMain.getUser(root.address);
      expect(r.rightChild).to.equal(user2.address);
      expect(r.rightTeamCount).to.equal(1n);
      expect(r.rightDirectCount).to.equal(1n);
      expect(r.directCount).to.equal(2n);
    });

    it("should revert if attempting to place in an already occupied position", async function () {
      const { elzoraMain, root, user1, user2 } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      await elzoraMain.connect(user1).register(root.address, root.address, 1); // Occupy Left
      await expect(
        elzoraMain.connect(user2).register(root.address, root.address, 1)
      ).to.be.revertedWithCustomError(elzoraMain, "PositionAlreadyOccupied");
    });

    it("should prevent duplicate registration of the same wallet", async function () {
      const { elzoraMain, root, user1 } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      await elzoraMain.connect(user1).register(root.address, root.address, 1);
      await expect(
        elzoraMain.connect(user1).register(root.address, user1.address, 1)
      ).to.be.revertedWithCustomError(elzoraMain, "AlreadyRegistered");
    });

    it("should prevent self-sponsoring or self-parenting", async function () {
      const { elzoraMain, root, user1 } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      await expect(
        elzoraMain.connect(user1).register(user1.address, root.address, 1)
      ).to.be.revertedWithCustomError(elzoraMain, "CannotSponsorSelf");

      await expect(
        elzoraMain.connect(user1).register(root.address, user1.address, 1)
      ).to.be.revertedWithCustomError(elzoraMain, "CannotSponsorSelf");
    });
  });

  describe("3. Direct & Affiliate Income Distribution", function () {
    it("should pay 20% ($10) Direct Income to Sponsor instantly to wallet", async function () {
      const { elzoraMain, mockUSDT, root, user1 } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      const balBefore = await mockUSDT.balanceOf(root.address);
      await elzoraMain.connect(user1).register(root.address, root.address, 1);
      const balAfter = await mockUSDT.balanceOf(root.address);

      const rootIncome = await elzoraMain.getIncomeBreakdown(root.address);
      expect(rootIncome.directIncome).to.equal(ethers.parseUnits("10", 6));

      // Root receives $10 Direct Income + $0.40 Level 1 Affiliate Income = $10.40 USDT instantly
      expect(balAfter - balBefore).to.equal(ethers.parseUnits("10.4", 6));
    });

    it("should pay 14% ($7) Affiliate Income across 20 upline levels ($0.40 L1-10, $0.30 L11-20)", async function () {
      const { elzoraMain, root, signers } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      // Register chain of users: Root -> s[3] -> s[4] -> s[5] -> s[6]
      let lastParent = root.address;
      let lastSponsor = root.address;
      for (let i = 3; i <= 6; i++) {
        const u = signers[i];
        await elzoraMain.connect(u).register(lastSponsor, lastParent, 1);
        lastParent = u.address;
        lastSponsor = u.address;
      }

      // signers[5] is 1 level above signers[6] -> receives $0.40 affiliate income
      const inc5 = await elzoraMain.getIncomeBreakdown(signers[5].address);
      expect(inc5.affiliateIncome).to.equal(ethers.parseUnits("0.40", 6));

      // signers[4] is 2 levels above signers[6] -> receives $0.40
      const inc4 = await elzoraMain.getIncomeBreakdown(signers[4].address);
      expect(inc4.affiliateIncome).to.equal(ethers.parseUnits("0.80", 6)); // From s[5] and s[6]
    });
  });

  describe("4. Binary Matching Income & Carry Forward", function () {
    it("should match 1:1 at $2/pair when qualified with 1 Left direct and 1 Right direct", async function () {
      const { elzoraMain, root, user1, user2 } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      // Root sponsors user1 on Left and user2 on Right (meets condition: 1 Left direct, 1 Right direct)
      await elzoraMain.connect(user1).register(root.address, root.address, 1);
      await elzoraMain.connect(user2).register(root.address, root.address, 2);

      const inc = await elzoraMain.getIncomeBreakdown(root.address);
      expect(inc.matchingIncome).to.equal(ethers.parseUnits("2", 6));
    });

    it("should divert matching income to Treasury if user does not have 1 Left direct and 1 Right direct", async function () {
      const { elzoraMain, mockUSDT, treasury, root, user1, user2 } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      const treasuryBalBefore = await mockUSDT.balanceOf(treasury.address);

      // Root only has 1 direct (user1). User2 is sponsored by user1, placed on Root's Right.
      // So Root has 1 Left volume and 1 Right volume, but only 0 Right directs (sponsored by user1).
      await elzoraMain.connect(user1).register(root.address, root.address, 1);
      await elzoraMain.connect(user2).register(user1.address, root.address, 2);

      const rootIncome = await elzoraMain.getIncomeBreakdown(root.address);
      // Root gets 0 matching income because of missing Right direct
      expect(rootIncome.matchingIncome).to.equal(0n);

      const treasuryBalAfter = await mockUSDT.balanceOf(treasury.address);
      // Missed $2 matching income went to Treasury wallet!
      expect(treasuryBalAfter - treasuryBalBefore).to.be.gte(ethers.parseUnits("2", 6));
    });
  });

  describe("5. Cascading Club Rank Progression", function () {
    it("should advance Starter queue and credit $10 Net Profit after 2 personal team members", async function () {
      const { elzoraMain, root, user1, user2 } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      // When user1 and user2 register under root, Root personal team achieves 2 Starter members!
      await elzoraMain.connect(user1).register(root.address, root.address, 1);
      await elzoraMain.connect(user2).register(root.address, root.address, 2);

      const r = await elzoraMain.getUser(root.address);
      expect(r.currentRank).to.be.gte(2n); // Advanced to Rank 2 (Leader)

      const inc = await elzoraMain.getIncomeBreakdown(root.address);
      expect(inc.clubIncome).to.equal(ethers.parseUnits("10", 6)); // Starter net profit
    });

    it("should ensure club progress is isolated to personal team and not cross-team global queue", async function () {
      const { elzoraMain, root, user1, user2, user3, user4 } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      // Root has user1 (Left) and user2 (Right)
      await elzoraMain.connect(user1).register(root.address, root.address, 1);
      await elzoraMain.connect(user2).register(root.address, root.address, 2);

      // User1 has 0 team members initially
      expect(await elzoraMain.getUserClubProgress(user1.address, 0)).to.equal(0n);

      // When user3 registers under user2 (not user1's team), user1's club progress remains 0
      await elzoraMain.connect(user3).register(user2.address, user2.address, 1);
      expect(await elzoraMain.getUserClubProgress(user1.address, 0)).to.equal(0n);

      // When user4 registers under user1 (user1's personal team), user1's progress increments to 1
      await elzoraMain.connect(user4).register(user1.address, user1.address, 1);
      expect(await elzoraMain.getUserClubProgress(user1.address, 0)).to.equal(1n);
    });
  });

  describe("6. Weekly & Champion Rewards", function () {
    it("should qualify sponsor for Champion Club at 3 directs (testing threshold) and allow batched admin distribution", async function () {
      const { elzoraMain, mockUSDT, deployer, root, signers } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      // Verify champion members array initially empty
      expect(await elzoraMain.getChampionMembersCount()).to.equal(0n);

      // Register 3 directs for root (testing requirement)
      let parent = root.address;
      for (let i = 0; i < 3; i++) {
        const dummyWallet = ethers.Wallet.createRandom().connect(ethers.provider);
        await signers[0].sendTransaction({ to: dummyWallet.address, value: ethers.parseEther("0.1") });
        await mockUSDT.mint(dummyWallet.address, ethers.parseUnits("50", 6));
        await mockUSDT.connect(dummyWallet).approve(await elzoraMain.getAddress(), ethers.MaxUint256);

        // Binary placement cascading on Left
        const pos = 1;
        await elzoraMain.connect(dummyWallet).register(root.address, parent, pos);
        parent = dummyWallet.address;
      }

      expect(await elzoraMain.isChampionMember(root.address)).to.be.true;
      expect(await elzoraMain.getChampionMembersCount()).to.equal(1n);

      // Check champion pool balance has accumulated $3 * 3 = $9 USDT
      expect(await elzoraMain.championPoolBalance()).to.equal(ethers.parseUnits("9", 6));

      // Fast forward 30 days for month close
      const monthEpoch = await elzoraMain.getCurrentMonthEpoch();
      await networkHelpers.time.increase(30 * 86400 + 1);

      // Admin creates monthly snapshot table
      await expect(elzoraMain.connect(deployer).createChampionMonthlySnapshot(monthEpoch))
        .to.emit(elzoraMain, "ChampionMonthlyPoolSnapshot");

      const rootBalBefore = await mockUSDT.balanceOf(root.address);

      // Admin distributes batch (batch size 50 or 100)
      await expect(elzoraMain.connect(deployer).distributeChampionBatch(monthEpoch, 50))
        .to.emit(elzoraMain, "ChampionBatchDistributed");

      const rootBalAfter = await mockUSDT.balanceOf(root.address);
      // Root received the $9 champion pool share directly into wallet
      expect(rootBalAfter - rootBalBefore).to.equal(ethers.parseUnits("9", 6));
    });

    it("should divert Champion monthly pool to Treasury if there are 0 qualified members", async function () {
      const { elzoraMain, mockUSDT, deployer, treasury, root, user1, user2 } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      // Register only 2 users (nobody reaches 30 directs, so 0 champion members)
      await elzoraMain.connect(user1).register(root.address, root.address, 1);
      await elzoraMain.connect(user2).register(root.address, root.address, 2);

      // Champion pool has $3 * 2 = $6 USDT
      expect(await elzoraMain.championPoolBalance()).to.equal(ethers.parseUnits("6", 6));
      expect(await elzoraMain.getChampionMembersCount()).to.equal(0n);

      const monthEpoch = await elzoraMain.getCurrentMonthEpoch();
      await networkHelpers.time.increase(30 * 86400 + 1);

      const treasuryBalBefore = await mockUSDT.balanceOf(treasury.address);

      // Admin triggers snapshot for month with 0 members
      await expect(elzoraMain.connect(deployer).createChampionMonthlySnapshot(monthEpoch))
        .to.emit(elzoraMain, "MissedIncomeSentToTreasury");

      const treasuryBalAfter = await mockUSDT.balanceOf(treasury.address);
      // $6 Champion pool transferred directly to Treasury
      expect(treasuryBalAfter - treasuryBalBefore).to.equal(ethers.parseUnits("6", 6));
      // Champion pool is reset for next month
      expect(await elzoraMain.championPoolBalance()).to.equal(0n);
    });

    it("should allow admin to take snapshot of closed week and batch distribute weekly reward to qualifiers", async function () {
      const { elzoraMain, mockUSDT, deployer, root, user1, user2, user3 } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      const currentEpoch = await elzoraMain.getCurrentWeeklyEpoch();

      // Root registers 3 directs within current week (Sunday to Saturday)
      await elzoraMain.connect(user1).register(root.address, root.address, 1);
      await elzoraMain.connect(user2).register(root.address, root.address, 2);
      await elzoraMain.connect(user3).register(root.address, user1.address, 1);

      expect(await elzoraMain.weeklyDirectCount(currentEpoch, root.address)).to.equal(3n);
      expect(await elzoraMain.isWeeklyQualifier(currentEpoch, root.address)).to.be.true;
      expect(await elzoraMain.getWeeklyQualifiersCount(currentEpoch)).to.equal(1n);

      // Fast forward to next Sunday morning (closed week)
      await networkHelpers.time.increase(7 * 86400 + 1);

      // Admin creates weekly pool snapshot on Sunday morning
      await expect(elzoraMain.connect(deployer).createWeeklyPoolSnapshot(currentEpoch))
        .to.emit(elzoraMain, "WeeklyPoolSnapshot");

      const rootBalBefore = await mockUSDT.balanceOf(root.address);

      // Admin distributes batch (size 50-100)
      await expect(elzoraMain.connect(deployer).distributeWeeklyBatch(currentEpoch, 50))
        .to.emit(elzoraMain, "WeeklyBatchDistributed");

      const rootBalAfter = await mockUSDT.balanceOf(root.address);
      // $3 * 3 = $9 accumulated in pool for that week, instantly paid to root
      expect(rootBalAfter - rootBalBefore).to.equal(ethers.parseUnits("9", 6));
    });
  });

  describe("7. Global Club ($25 Re-entry Algorithm)", function () {
    it("should execute 1 -> 2, 3 -> cycle & auto re-entry at entry #4", async function () {
      const { elzoraMain, user1, user2, user3 } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      // First register user1, user2, user3
      const { root } = await networkHelpers.loadFixture(deployElzoraFixture);
      await elzoraMain.connect(user1).register(root.address, root.address, 1);
      await elzoraMain.connect(user2).register(root.address, root.address, 2);
      await elzoraMain.connect(user3).register(root.address, user1.address, 1);

      // Entry 0: user1 enters Global Club ($25)
      await elzoraMain.connect(user1).joinGlobalClub();
      expect(await elzoraMain.getGlobalClubEntriesCount()).to.equal(1n);

      // Entry 1: user2 enters Global Club ($25)
      await elzoraMain.connect(user2).joinGlobalClub();

      // Entry 2: user3 enters Global Club ($25) -> triggers cycle completion for Entry 0!
      // Upon completion, user1 earns $25 cycle reward and a new re-entry is generated at Entry 3 (#4 in 1-based indexing)
      await expect(elzoraMain.connect(user3).joinGlobalClub())
        .to.emit(elzoraMain, "GlobalClubCycleCompleted")
        .withArgs(0n, user1.address, ethers.parseUnits("25", 6), 3n);

      // Verify user1 received $25 Global Club income
      const inc1 = await elzoraMain.getIncomeBreakdown(user1.address);
      expect(inc1.globalClubIncome).to.equal(ethers.parseUnits("25", 6));

      // Verify re-entry was created for user1
      expect(await elzoraMain.getGlobalClubEntriesCount()).to.equal(4n);
      const reentry = await elzoraMain.getGlobalClubEntry(3);
      expect(reentry.user).to.equal(user1.address);
      expect(reentry.isReentry).to.be.true;
    });
  });

  describe("8. Treasury Solvency & Instant Wallet Income", function () {
    it("should instantly transfer earned income to user wallet upon distribution", async function () {
      const { elzoraMain, mockUSDT, root, user1 } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      const balBefore = await mockUSDT.balanceOf(root.address);
      await elzoraMain.connect(user1).register(root.address, root.address, 1);
      const balAfter = await mockUSDT.balanceOf(root.address);

      // Root receives $10 Direct Income + $0.40 Level 1 Affiliate = $10.40 USDT directly to wallet
      expect(balAfter - balBefore).to.equal(ethers.parseUnits("10.4", 6));

      const updated = await elzoraMain.getUser(root.address);
      expect(updated.totalIncomeEarned).to.equal(ethers.parseUnits("10.4", 6));
    });

    it("should verify contract solvency (token balance >= liabilities)", async function () {
      const { elzoraGateway } = await networkHelpers.loadFixture(deployElzoraFixture);
      const overview = await elzoraGateway.getProtocolOverview();
      expect(overview.isSolvent).to.be.true;
      expect(overview.contractTokenBalance).to.be.gte(overview.totalLiabilities);
    });
  });

  describe("9. Gateway Integration & Batch Views", function () {
    it("should route registration through ElzoraGateway seamlessly", async function () {
      const { elzoraGateway, elzoraMain, root, user1 } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      await elzoraGateway.connect(user1).register(root.address, root.address, 1);

      const u1 = await elzoraMain.getUser(user1.address);
      expect(u1.isRegistered).to.be.true;

      const dash = await elzoraGateway.getUserDashboard(user1.address);
      expect(dash.profile.isRegistered).to.be.true;
      expect(dash.profile.sponsor).to.equal(root.address);
    });

    it("should provide complete binary team summary via Gateway", async function () {
      const { elzoraGateway, root, user1, user2 } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      await elzoraGateway.connect(user1).register(root.address, root.address, 1);
      await elzoraGateway.connect(user2).register(root.address, root.address, 2);

      const summary = await elzoraGateway.getBinaryTeamSummary(root.address);
      expect(summary.leftChild).to.equal(user1.address);
      expect(summary.rightChild).to.equal(user2.address);
      expect(summary.leftDirects).to.equal(1n);
      expect(summary.rightDirects).to.equal(1n);
      expect(summary.leftTotalMembers).to.equal(1n);
      expect(summary.rightTotalMembers).to.equal(1n);
    });
  });

  describe("10. Pause & Access Control Security", function () {
    it("should prevent unauthorized registration when paused", async function () {
      const { elzoraMain, deployer, root, user1, attacker } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      await elzoraMain.connect(deployer).pause();
      expect(await elzoraMain.paused()).to.be.true;

      await expect(
        elzoraMain.connect(user1).register(root.address, root.address, 1)
      ).to.be.revertedWithCustomError(elzoraMain, "EnforcedPause");

      // Non-owner cannot unpause
      await expect(
        elzoraMain.connect(attacker).unpause()
      ).to.be.revertedWithCustomError(elzoraMain, "OwnableUnauthorizedAccount");

      // Owner unpauses
      await elzoraMain.connect(deployer).unpause();
      expect(await elzoraMain.paused()).to.be.false;

      // Registration works again
      await expect(
        elzoraMain.connect(user1).register(root.address, root.address, 1)
      ).to.emit(elzoraMain, "UserRegistered");
    });

    it("should restrict admin functions to owner only", async function () {
      const { elzoraMain, attacker, user1 } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      await expect(
        elzoraMain.connect(attacker).setTreasuryWallet(user1.address)
      ).to.be.revertedWithCustomError(elzoraMain, "OwnableUnauthorizedAccount");

      await expect(
        elzoraMain.connect(attacker).emergencyRescue(attacker.address, attacker.address, 100)
      ).to.be.revertedWithCustomError(elzoraMain, "OwnableUnauthorizedAccount");
    });
  });

  describe("11. Lifetime Milestone Claims", function () {
    it("should claim Milestone 1 ($25) when achieving 5 Left and 5 Right members", async function () {
      const { elzoraMain, root, mockUSDT } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      // Create 5 left and 5 right members using dummy wallets
      let leftParent = root.address;
      let rightParent = root.address;

      for (let i = 0; i < 5; i++) {
        const dummyLeft = ethers.Wallet.createRandom().connect(ethers.provider);
        await networkHelpers.setBalance(dummyLeft.address, ethers.parseEther("1"));
        await mockUSDT.mint(dummyLeft.address, ethers.parseUnits("50", 6));
        await mockUSDT.connect(dummyLeft).approve(await elzoraMain.getAddress(), ethers.MaxUint256);
        await elzoraMain.connect(dummyLeft).register(root.address, leftParent, 1);
        leftParent = dummyLeft.address;

        const dummyRight = ethers.Wallet.createRandom().connect(ethers.provider);
        await networkHelpers.setBalance(dummyRight.address, ethers.parseEther("1"));
        await mockUSDT.mint(dummyRight.address, ethers.parseUnits("50", 6));
        await mockUSDT.connect(dummyRight).approve(await elzoraMain.getAddress(), ethers.MaxUint256);
        await elzoraMain.connect(dummyRight).register(root.address, rightParent, 2);
        rightParent = dummyRight.address;
      }

      const r = await elzoraMain.getUser(root.address);
      expect(r.leftTeamCount).to.equal(5n);
      expect(r.rightTeamCount).to.equal(5n);

      // Root already manually joins Single Leg so reward goes directly to root
      await elzoraMain.connect(root).joinGlobalClub();

      // Claim milestone 0 (Milestone 1: 5L/5R = $25)
      await expect(elzoraMain.connect(root).claimLifetimeMilestone(0))
        .to.emit(elzoraMain, "LifetimeRewardClaimed")
        .withArgs(root.address, 0n, ethers.parseUnits("25", 6));

      // Attempting duplicate claim should revert
      await expect(
        elzoraMain.connect(root).claimLifetimeMilestone(0)
      ).to.be.revertedWithCustomError(elzoraMain, "LifetimeMilestoneAlreadyClaimed");

      const inc = await elzoraMain.getIncomeBreakdown(root.address);
      expect(inc.lifetimeIncome).to.equal(ethers.parseUnits("25", 6));
    });

    it("should prevent claiming lifetime milestone if direct referrals condition is not met, and allow claiming once met", async function () {
      const { elzoraMain, root, user1, mockUSDT } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      // Register user1 under root (root has 1 direct)
      await elzoraMain.connect(user1).register(root.address, root.address, 1);

      // Place 5 Left and 5 Right under user1, but user1 sponsors NONE of them (root sponsors them)
      let leftParent = user1.address;
      let rightParent = user1.address;

      for (let i = 0; i < 5; i++) {
        const dL = ethers.Wallet.createRandom().connect(ethers.provider);
        await networkHelpers.setBalance(dL.address, ethers.parseEther("1"));
        await mockUSDT.mint(dL.address, ethers.parseUnits("50", 6));
        await mockUSDT.connect(dL).approve(await elzoraMain.getAddress(), ethers.MaxUint256);
        await elzoraMain.connect(dL).register(root.address, leftParent, 1);
        leftParent = dL.address;

        const dR = ethers.Wallet.createRandom().connect(ethers.provider);
        await networkHelpers.setBalance(dR.address, ethers.parseEther("1"));
        await mockUSDT.mint(dR.address, ethers.parseUnits("50", 6));
        await mockUSDT.connect(dR).approve(await elzoraMain.getAddress(), ethers.MaxUint256);
        await elzoraMain.connect(dR).register(root.address, rightParent, 2);
        rightParent = dR.address;
      }

      const u1Prof = await elzoraMain.getUser(user1.address);
      expect(u1Prof.leftTeamCount).to.equal(5n);
      expect(u1Prof.rightTeamCount).to.equal(5n);
      expect(u1Prof.directCount).to.equal(0n); // 0 directs!

      // Milestone 0 (Tier 1-5 requires 1 direct): Calling claim should revert with LifetimeMilestoneDirectsNotMet
      await expect(
        elzoraMain.connect(user1).claimLifetimeMilestone(0)
      ).to.be.revertedWithCustomError(elzoraMain, "LifetimeMilestoneDirectsNotMet");

      // Income is NOT sent to treasury; it waits safely.
      // Now user1 sponsors 1 new user (completes condition: 1 direct)
      const u1Direct = ethers.Wallet.createRandom().connect(ethers.provider);
      await networkHelpers.setBalance(u1Direct.address, ethers.parseEther("1"));
      await mockUSDT.mint(u1Direct.address, ethers.parseUnits("50", 6));
      await mockUSDT.connect(u1Direct).approve(await elzoraMain.getAddress(), ethers.MaxUint256);
      await elzoraMain.connect(u1Direct).register(user1.address, leftParent, 1);

      expect((await elzoraMain.getUser(user1.address)).directCount).to.equal(1n);

      // Now user1 can claim the milestone successfully!
      // Since user1 has NOT yet joined Single Leg, this $25 auto-activates user1's Single Leg entry!
      await expect(elzoraMain.connect(user1).claimLifetimeMilestone(0))
        .to.emit(elzoraMain, "LifetimeRewardClaimed")
        .withArgs(user1.address, 0n, ethers.parseUnits("25", 6));

      expect(await elzoraMain.getGlobalClubEntriesCount()).to.equal(1n);
      const user1Entries = await elzoraMain.getUserGlobalClubEntries(user1.address);
      expect(user1Entries.length).to.equal(1);
    });

    it("should pay $25 directly to wallet if user already manually activated Single Leg before claiming Milestone 1", async function () {
      const { elzoraMain, root, user1, mockUSDT } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      await elzoraMain.connect(user1).register(root.address, root.address, 1);

      // User1 manually activates Single Leg for $25 USDT upfront
      await elzoraMain.connect(user1).joinGlobalClub();
      expect(await elzoraMain.getGlobalClubEntriesCount()).to.equal(1n);

      // Now achieve 5L/5R and 1 direct for user1
      let leftParent = user1.address;
      let rightParent = user1.address;

      for (let i = 0; i < 5; i++) {
        const dL = ethers.Wallet.createRandom().connect(ethers.provider);
        await networkHelpers.setBalance(dL.address, ethers.parseEther("1"));
        await mockUSDT.mint(dL.address, ethers.parseUnits("50", 6));
        await mockUSDT.connect(dL).approve(await elzoraMain.getAddress(), ethers.MaxUint256);
        await elzoraMain.connect(dL).register(user1.address, leftParent, 1);
        leftParent = dL.address;

        const dR = ethers.Wallet.createRandom().connect(ethers.provider);
        await networkHelpers.setBalance(dR.address, ethers.parseEther("1"));
        await mockUSDT.mint(dR.address, ethers.parseUnits("50", 6));
        await mockUSDT.connect(dR).approve(await elzoraMain.getAddress(), ethers.MaxUint256);
        await elzoraMain.connect(dR).register(user1.address, rightParent, 2);
        rightParent = dR.address;
      }

      const balBefore = await mockUSDT.balanceOf(user1.address);
      // Since user1 already has an active entry, this $25 goes directly to wallet
      await elzoraMain.connect(user1).claimLifetimeMilestone(0);
      const balAfter = await mockUSDT.balanceOf(user1.address);
      expect(balAfter - balBefore).to.equal(ethers.parseUnits("25", 6));
    });
  });

  describe("12. Global Club Exact 12-Entry Algorithm Sequence", function () {
    it("should match the complete entry and re-entry sequence from the specification", async function () {
      const { elzoraMain, root, signers, mockUSDT } =
        await networkHelpers.loadFixture(deployElzoraFixture);

      // Register 6 members
      let parent = root.address;
      const members: any[] = [];
      for (let i = 1; i <= 6; i++) {
        const u = ethers.Wallet.createRandom().connect(ethers.provider);
        await networkHelpers.setBalance(u.address, ethers.parseEther("1"));
        await mockUSDT.mint(u.address, ethers.parseUnits("500", 6));
        await mockUSDT.connect(u).approve(await elzoraMain.getAddress(), ethers.MaxUint256);
        await elzoraMain.connect(u).register(root.address, parent, 1);
        parent = u.address;
        members.push(u);
      }

      // Entry 0: User 1
      await elzoraMain.connect(members[0]).joinGlobalClub();
      expect(await elzoraMain.getGlobalClubEntriesCount()).to.equal(1n);

      // Entry 1: User 2
      await elzoraMain.connect(members[1]).joinGlobalClub();
      expect(await elzoraMain.getGlobalClubEntriesCount()).to.equal(2n);

      // Entry 2: User 3 -> triggers User 1 cycle completion, creates Re-entry for User 1 at Entry 3
      await elzoraMain.connect(members[2]).joinGlobalClub();
      expect(await elzoraMain.getGlobalClubEntriesCount()).to.equal(4n); // 0, 1, 2, + 3(reentry 1)

      const entry3 = await elzoraMain.getGlobalClubEntry(3);
      expect(entry3.user).to.equal(members[0].address);
      expect(entry3.isReentry).to.be.true;

      // Entry 4: User 4 -> triggers User 2 cycle completion, creates Re-entry for User 2 at Entry 5
      await elzoraMain.connect(members[3]).joinGlobalClub();
      expect(await elzoraMain.getGlobalClubEntriesCount()).to.equal(6n); // 0,1,2,3, 4, + 5(reentry 2)

      const entry5 = await elzoraMain.getGlobalClubEntry(5);
      expect(entry5.user).to.equal(members[1].address);
      expect(entry5.isReentry).to.be.true;

      // Entry 6: User 5 -> triggers User 3 cycle completion, creates Re-entry for User 3 at Entry 7
      await elzoraMain.connect(members[4]).joinGlobalClub();
      expect(await elzoraMain.getGlobalClubEntriesCount()).to.equal(8n); // 6, + 7(reentry 3)

      const entry7 = await elzoraMain.getGlobalClubEntry(7);
      expect(entry7.user).to.equal(members[2].address);
      expect(entry7.isReentry).to.be.true;

      // Entry 8: User 6 -> triggers User 1 (Entry 3) cycle completion, creates Re-entry for User 1 at Entry 9
      await elzoraMain.connect(members[5]).joinGlobalClub();
      expect(await elzoraMain.getGlobalClubEntriesCount()).to.equal(10n); // 8, + 9(reentry 4)

      const entry9 = await elzoraMain.getGlobalClubEntry(9);
      expect(entry9.user).to.equal(members[0].address); // Re-entry for original user 1
      expect(entry9.isReentry).to.be.true;
    });
  });
});
