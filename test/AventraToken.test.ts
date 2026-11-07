// @ts-nocheck
import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

describe.skip("AventraToken", function () {
  async function deployTokenFixture() {
    const [admin, alice, bob] = await ethers.getSigners();
    const token = await ethers.deployContract("AventraToken", [admin.address]);
    return { token, admin, alice, bob };
  }

  it("should initialize token metadata, PAUSER_ROLE, and fixed 2.1 Million total supply", async function () {
    const { token, admin } = await networkHelpers.loadFixture(deployTokenFixture);
    expect(await token.name()).to.equal("AventraX");
    expect(await token.symbol()).to.equal("AVX");
    expect(await token.decimals()).to.equal(18n);

    const expectedInitialSupply = ethers.parseEther("2100000"); // 21 Lac tokens
    expect(await token.totalSupply()).to.equal(expectedInitialSupply);
    expect(await token.balanceOf(admin.address)).to.equal(expectedInitialSupply);

    const PAUSER_ROLE = await token.PAUSER_ROLE();
    expect(await token.hasRole(PAUSER_ROLE, admin.address)).to.be.true;
  });

  it("should allow token transfer from initial supply holder", async function () {
    const { token, admin, alice } = await networkHelpers.loadFixture(deployTokenFixture);
    const amount = ethers.parseEther("100");
    await token.connect(admin).transfer(alice.address, amount);
    expect(await token.balanceOf(alice.address)).to.equal(amount);
  });

  it("should pause and unpause token transfers correctly", async function () {
    const { token, admin, alice, bob } = await networkHelpers.loadFixture(deployTokenFixture);
    await token.connect(admin).transfer(alice.address, ethers.parseEther("100"));

    await token.pause();
    await expect(
      token.connect(alice).transfer(bob.address, ethers.parseEther("10"))
    ).to.be.revertedWithCustomError(token, "EnforcedPause");

    await token.unpause();
    await token.connect(alice).transfer(bob.address, ethers.parseEther("10"));
    expect(await token.balanceOf(bob.address)).to.equal(ethers.parseEther("10"));
  });
});
