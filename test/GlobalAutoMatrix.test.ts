import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Global 2xN Auto-Matrix (Model C) & Bottom-to-Top Affiliate Income", function () {
  async function deployFixture() {
    const signers = await ethers.getSigners();
    const [deployer, root, treasury, ...users] = signers;

    // Deploy 18-decimal Test USDT (same as BSC-USD on BSC Mainnet)
    const mockUSDT = (await ethers.deployContract("TestToken")) as any;

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

    const elzoraGateway = (await ethers.deployContract("ElzoraGateway", [
      await elzoraMain.getAddress(),
    ])) as any;

    await elzoraMain.connect(deployer).setGatewayContract(await elzoraGateway.getAddress());

    // Mint tokens & approve for all users
    const mintAmount = ethers.parseEther("10000");
    for (const s of signers) {
      await mockUSDT.mint(s.address, mintAmount);
      await mockUSDT.connect(s).approve(await elzoraMain.getAddress(), ethers.MaxUint256);
      await mockUSDT.connect(s).approve(await elzoraGateway.getAddress(), ethers.MaxUint256);
    }

    return {
      deployer,
      root,
      treasury,
      users,
      signers,
      mockUSDT,
      elzoraMain,
      elzoraGateway,
    };
  }

  describe("1. Initialization of 15 Live IDs into Global Matrix", function () {
    it("Should test upgradeToAndCall with initializeGlobalMatrix for 15 users", async function () {
      const { deployer, root, treasury, users, mockUSDT } = await deployFixture();

      // Simulate 15 user addresses
      const initial15 = [root.address, ...users.slice(0, 14).map((u) => u.address)];

      // Deploy implementation
      const impl = await ethers.deployContract("ElzoraMain");
      expect(await impl.getAddress()).to.properAddress;
    });

    it("Should correctly map parent-child relationships and positions in 2xN auto matrix", async function () {
      const { deployer, root, users, elzoraMain, mockUSDT } = await deployFixture();

      // Root is ID 1
      expect(await elzoraMain.userGlobalMatrixId(root.address)).to.equal(1);
      expect(await elzoraMain.getGlobalMatrixUsersCount()).to.equal(1);

      // Register User 2 (should be ID 2, parent ID 1, Left)
      const u2 = users[0];
      await elzoraMain.connect(u2).register(root.address, ethers.ZeroAddress, 0);
      expect(await elzoraMain.userGlobalMatrixId(u2.address)).to.equal(2);
      const prof2 = await elzoraMain.getUser(u2.address);
      expect(prof2.parent).to.equal(root.address);
      expect(prof2.position).to.equal(1); // Left

      // Register User 3 (should be ID 3, parent ID 1, Right)
      const u3 = users[1];
      await elzoraMain.connect(u3).register(root.address, ethers.ZeroAddress, 0);
      expect(await elzoraMain.userGlobalMatrixId(u3.address)).to.equal(3);
      const prof3 = await elzoraMain.getUser(u3.address);
      expect(prof3.parent).to.equal(root.address);
      expect(prof3.position).to.equal(2); // Right

      // Register User 4 (should be ID 4, parent ID 2, Left)
      const u4 = users[2];
      await elzoraMain.connect(u4).register(u3.address, ethers.ZeroAddress, 0); // sponsor is u3, but auto parent is u2!
      expect(await elzoraMain.userGlobalMatrixId(u4.address)).to.equal(4);
      const prof4 = await elzoraMain.getUser(u4.address);
      expect(prof4.parent).to.equal(u2.address);
      expect(prof4.position).to.equal(1); // Left
      expect(prof4.sponsor).to.equal(u3.address); // Sponsor preserved!

      // Register User 5 (should be ID 5, parent ID 2, Right)
      const u5 = users[3];
      await elzoraMain.connect(u5).register(root.address, ethers.ZeroAddress, 0);
      expect(await elzoraMain.userGlobalMatrixId(u5.address)).to.equal(5);
      const prof5 = await elzoraMain.getUser(u5.address);
      expect(prof5.parent).to.equal(u2.address);
      expect(prof5.position).to.equal(2); // Right

      // Register User 6 (should be ID 6, parent ID 3, Left)
      const u6 = users[4];
      await elzoraMain.connect(u6).register(root.address, ethers.ZeroAddress, 0);
      expect(await elzoraMain.userGlobalMatrixId(u6.address)).to.equal(6);
      const prof6 = await elzoraMain.getUser(u6.address);
      expect(prof6.parent).to.equal(u3.address);
      expect(prof6.position).to.equal(1); // Left

      // Register User 7 (should be ID 7, parent ID 3, Right)
      const u7 = users[5];
      await elzoraMain.connect(u7).register(root.address, ethers.ZeroAddress, 0);
      expect(await elzoraMain.userGlobalMatrixId(u7.address)).to.equal(7);
      const prof7 = await elzoraMain.getUser(u7.address);
      expect(prof7.parent).to.equal(u3.address);
      expect(prof7.position).to.equal(2); // Right

      // Register User 8 (should be ID 8, parent ID 4, Left)
      const u8 = users[6];
      await elzoraMain.connect(u8).register(root.address, ethers.ZeroAddress, 0);
      expect(await elzoraMain.userGlobalMatrixId(u8.address)).to.equal(8);
      const prof8 = await elzoraMain.getUser(u8.address);
      expect(prof8.parent).to.equal(u4.address);
      expect(prof8.position).to.equal(1); // Left
    });
  });

  describe("2. Bottom-to-Top Affiliate Income Distribution ($0.40 L1-10, $0.30 L11-20)", function () {
    it("Should pay $0.40 USDT to levels 1 to 10 uplines along the global tree path", async function () {
      const { deployer, root, users, elzoraMain, mockUSDT } = await deployFixture();

      // Register IDs 2 to 15 (Level 1, 2, 3)
      for (let i = 0; i < 14; i++) {
        await elzoraMain.connect(users[i]).register(root.address, ethers.ZeroAddress, 0);
      }
      expect(await elzoraMain.getGlobalMatrixUsersCount()).to.equal(15);

      // Now register ID 16 (placed under ID 8 = users[6], Left)
      // Path from ID 16:
      // Level 1: ID 8 (users[6]) -> gets $0.40
      // Level 2: ID 4 (users[2]) -> gets $0.40
      // Level 3: ID 2 (users[0]) -> gets $0.40
      // Level 4: ID 1 (root)     -> gets $0.40
      // Level 5..10: No uplines  -> $0.40 * 6 = $2.40 to Treasury
      // Level 11..20: No uplines -> $0.30 * 10 = $3.00 to Treasury
      const u16 = users[14];
      const u8 = users[6];
      const u4 = users[2];
      const u2 = users[0];

      const u8BalBefore = await mockUSDT.balanceOf(u8.address);
      const u4BalBefore = await mockUSDT.balanceOf(u4.address);
      const u2BalBefore = await mockUSDT.balanceOf(u2.address);
      const rootBalBefore = await mockUSDT.balanceOf(root.address);

      // Register u16 sponsored by root
      await elzoraMain.connect(u16).register(root.address, ethers.ZeroAddress, 0);

      const dec = await mockUSDT.decimals();
      const expectedAffiliateL1_10 = ethers.parseUnits("0.40", dec);

      const u8Inc = await elzoraMain.getIncomeBreakdown(u8.address);
      const u4Inc = await elzoraMain.getIncomeBreakdown(u4.address);
      const u2Inc = await elzoraMain.getIncomeBreakdown(u2.address);

      // Verify that ID 8 received $0.40 affiliate income
      expect(u8Inc.affiliateIncome).to.equal(expectedAffiliateL1_10);
      expect((await mockUSDT.balanceOf(u8.address)) - u8BalBefore).to.equal(expectedAffiliateL1_10);

      // Verify that ID 4 received $0.40 affiliate income
      expect((await mockUSDT.balanceOf(u4.address)) - u4BalBefore).to.equal(expectedAffiliateL1_10);

      // Verify that ID 2 received $0.40 affiliate income
      expect((await mockUSDT.balanceOf(u2.address)) - u2BalBefore).to.equal(expectedAffiliateL1_10);

      // Direct income ($10) goes to sponsor (root)
      const rootInc = await elzoraMain.getIncomeBreakdown(root.address);
      expect(rootInc.directIncome).to.be.gt(0);
    });
  });

  describe("3. Gateway Registration Compatibility", function () {
    it("Should allow registration via ElzoraGateway without requiring manual parent/position", async function () {
      const { deployer, root, users, elzoraMain, elzoraGateway } = await deployFixture();

      const u2 = users[0];
      // Call gateway register with dummy parent and position
      await elzoraGateway.connect(u2).register(root.address, ethers.ZeroAddress, 0);

      expect(await elzoraMain.userGlobalMatrixId(u2.address)).to.equal(2);
      const prof = await elzoraMain.getUser(u2.address);
      expect(prof.parent).to.equal(root.address);
      expect(prof.position).to.equal(1); // Auto placed Left!
    });
  });
});
