import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("SamplePrimarySaleERC721", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const SampleOperatorAllowlist = await hre.ethers.getContractFactory(
      "SampleOperatorAllowlist"
    );

    const SampleImmutableERC20 = await hre.ethers.getContractFactory(
      "SampleImmutableERC20"
    );

    const SampleImmutableERC721 = await hre.ethers.getContractFactory(
      "SampleImmutableERC721"
    );

    const SamplePrimarySaleERC721 = await hre.ethers.getContractFactory(
      "SamplePrimarySaleERC721"
    );

    const sampleOperatorAllowlist = await SampleOperatorAllowlist.deploy();

    const sampleImmutableERC20 = await SampleImmutableERC20.deploy(
      "FAKE",
      "FKLOOT",
      BigInt("1000000000000000000000000"), // 1000 * 10^6
      owner,
      owner
    );

    const sampleImmutableERC721 = await SampleImmutableERC721.deploy(
      owner,
      "Fake Loot",
      "FKLOOT",
      "",
      "",
      sampleOperatorAllowlist.target,
      owner,
      5
    );

    const samplePrimarySaleErc721 = await SamplePrimarySaleERC721.deploy();

    await samplePrimarySaleErc721.setErc20(sampleImmutableERC20.target, 18);
    await samplePrimarySaleErc721.setErc721(sampleImmutableERC721.target);
    await samplePrimarySaleErc721.startSale();
    await samplePrimarySaleErc721.addToWhitelist(owner.address);
    await sampleImmutableERC721.grantMinterRole(samplePrimarySaleErc721.target);
    await sampleImmutableERC20.approve(
      owner.address,
      BigInt("1000000000000000000000000")
    );
    await sampleImmutableERC20.approve(
      samplePrimarySaleErc721.target,
      BigInt("1000000000000000000000000")
    );

    return {
      sampleImmutableERC20,
      sampleImmutableERC721,
      samplePrimarySaleErc721,
      owner,
      otherAccount,
    };
  }

  describe("Deployment", function () {
    it("Should have the right owner", async function () {
      const { samplePrimarySaleErc721, owner } = await loadFixture(
        deployFixture
      );
      expect(await samplePrimarySaleErc721.owner()).to.equal(owner.address);
    });

    it("Should have totalMinted as 0", async function () {
      const { samplePrimarySaleErc721 } = await loadFixture(deployFixture);
      expect(await samplePrimarySaleErc721.totalMinted()).to.equal(0);
    });

    it("Should have maxSupply as 250", async function () {
      const { samplePrimarySaleErc721 } = await loadFixture(deployFixture);
      expect(await samplePrimarySaleErc721.maxSupply()).to.equal(250);
    });

    it("Should have the isStarted as true", async function () {
      const { samplePrimarySaleErc721 } = await loadFixture(deployFixture);
      expect(await samplePrimarySaleErc721.isStarted()).to.equal(true);
    });

    it("Should have the owner being minted erc20 balance", async function () {
      const { sampleImmutableERC20, owner } = await loadFixture(deployFixture);
      expect(await sampleImmutableERC20.balanceOf(owner.address)).to.equal(
        BigInt("1000000000000000000000000")
      );
    });

    it("Should provide the sale contract the minter role", async function () {
      const { sampleImmutableERC721, samplePrimarySaleErc721 } =
        await loadFixture(deployFixture);
      expect(
        await sampleImmutableERC721.hasRole(
          await sampleImmutableERC721.MINTER_ROLE(),
          samplePrimarySaleErc721.target
        )
      ).to.equal(true);
    });
  });

  describe("Set up", function () {
    it("Should be able to call startSale and stopSale by owner", async function () {
      const { samplePrimarySaleErc721 } = await loadFixture(deployFixture);
      expect(await samplePrimarySaleErc721.isStarted()).to.be.true;
      expect(await samplePrimarySaleErc721.stopSale()).to.be.ok;
      expect(await samplePrimarySaleErc721.isStarted()).to.be.false;
    });

    it("Should not be able to call startSale and stopSale by non-owner", async function () {
      const { samplePrimarySaleErc721, otherAccount } = await loadFixture(
        deployFixture
      );
      await expect(
        samplePrimarySaleErc721.connect(otherAccount).startSale()
      ).to.be.revertedWith("Ownable: caller is not the owner");
      await expect(
        samplePrimarySaleErc721.connect(otherAccount).stopSale()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should be able to addToWhitelist and removeFromWhitelist if owner", async function () {
      const { samplePrimarySaleErc721, owner } = await loadFixture(
        deployFixture
      );
      expect(await samplePrimarySaleErc721.addToWhitelist(owner.address)).to.be
        .ok;
      expect(await samplePrimarySaleErc721.whitelist(owner.address)).to.equal(
        true
      );
      expect(await samplePrimarySaleErc721.removeFromWhitelist(owner.address))
        .to.be.ok;
      expect(await samplePrimarySaleErc721.whitelist(owner.address)).to.equal(
        false
      );
    });

    it("Should not be able addToWhitelist if non-owner", async function () {
      const { samplePrimarySaleErc721, otherAccount } = await loadFixture(
        deployFixture
      );
      await expect(
        samplePrimarySaleErc721
          .connect(otherAccount)
          .addToWhitelist(otherAccount.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Public mint", function () {
    it("Should not be able to mint if sale not started", async function () {
      const { samplePrimarySaleErc721 } = await loadFixture(deployFixture);
      await samplePrimarySaleErc721.stopSale();
      await expect(samplePrimarySaleErc721.mintFree()).to.be.revertedWith(
        "Sale has not started"
      );
    });

    it("Should be able to free mint 5x per wallet", async function () {
      const { samplePrimarySaleErc721, sampleImmutableERC721, owner } =
        await loadFixture(deployFixture);
      for (let i = 0; i < 5; i++) {
        expect(await samplePrimarySaleErc721.mintFree()).to.be.ok;
      }
      await expect(samplePrimarySaleErc721.mintFree()).to.be.revertedWith(
        "Minted too many times"
      );
      expect(await sampleImmutableERC721.balanceOf(owner.address)).to.equal(5);
    });

    it("Should be able to native mint 5x per wallet", async function () {
      const { samplePrimarySaleErc721, sampleImmutableERC721, owner } =
        await loadFixture(deployFixture);
      for (let i = 0; i < 5; i++) {
        expect(
          await samplePrimarySaleErc721.mintNative({
            value: ethers.parseEther("0.01"),
          })
        ).to.be.ok;
      }
      await expect(
        samplePrimarySaleErc721.mintNative({ value: ethers.parseEther("0.01") })
      ).to.be.revertedWith("Minted too many times");
      expect(await sampleImmutableERC721.balanceOf(owner.address)).to.equal(5);
    });

    it("Should be able to erc20 mint 5x per wallet", async function () {
      const { samplePrimarySaleErc721, sampleImmutableERC721, owner } =
        await loadFixture(deployFixture);
      for (let i = 0; i < 5; i++) {
        expect(await samplePrimarySaleErc721.mintErc20()).to.be.ok;
      }
      await expect(samplePrimarySaleErc721.mintErc20()).to.be.revertedWith(
        "Minted too many times"
      );
      expect(await sampleImmutableERC721.balanceOf(owner.address)).to.equal(5);
    });
  });

  describe("Whitelisted mint", function () {
    it("Should be able to free mint 5x per wallet if whitelisted", async function () {
      const {
        samplePrimarySaleErc721,
        sampleImmutableERC721,
        owner,
        otherAccount,
      } = await loadFixture(deployFixture);
      for (let i = 0; i < 5; i++) {
        expect(await samplePrimarySaleErc721.mintFreeWL()).to.be.ok;
      }
      await expect(
        samplePrimarySaleErc721.connect(otherAccount).mintFreeWL()
      ).to.be.revertedWith("User is not whitelisted");
      expect(await sampleImmutableERC721.balanceOf(owner.address)).to.equal(5);
      expect(
        await sampleImmutableERC721.balanceOf(otherAccount.address)
      ).to.equal(0);
    });

    it("Should be able to native mint 5x per wallet if whitelisted", async function () {
      const {
        samplePrimarySaleErc721,
        sampleImmutableERC721,
        owner,
        otherAccount,
      } = await loadFixture(deployFixture);
      for (let i = 0; i < 5; i++) {
        expect(
          await samplePrimarySaleErc721.mintNativeWL({
            value: ethers.parseEther("0.01"),
          })
        ).to.be.ok;
      }
      await expect(
        samplePrimarySaleErc721.connect(otherAccount).mintNativeWL()
      ).to.be.revertedWith("User is not whitelisted");
      expect(await sampleImmutableERC721.balanceOf(owner.address)).to.equal(5);
      expect(
        await sampleImmutableERC721.balanceOf(otherAccount.address)
      ).to.equal(0);
    });

    it("Should be able to erc20 mint 5x per wallet if whitelisted", async function () {
      const { samplePrimarySaleErc721, sampleImmutableERC721, owner } =
        await loadFixture(deployFixture);
      for (let i = 0; i < 5; i++) {
        expect(await samplePrimarySaleErc721.mintErc20WL()).to.be.ok;
      }
      // removing owner from whitelist for simplicity testing purposes
      await samplePrimarySaleErc721.removeFromWhitelist(owner.address);
      await expect(samplePrimarySaleErc721.mintErc20WL()).to.be.revertedWith(
        "User is not whitelisted"
      );
      expect(await sampleImmutableERC721.balanceOf(owner.address)).to.equal(5);
    });
  });
  describe("Withdrawals", function () {
    it("Should split withdrawals to owner and imx wallet for native", async function () {
      const { samplePrimarySaleErc721, sampleImmutableERC20, owner } =
        await loadFixture(deployFixture);
      const initialBalance = await ethers.provider.getBalance(owner.address);
      for (let i = 0; i < 5; i++) {
        expect(
          await samplePrimarySaleErc721.mintNative({
            value: ethers.parseEther("0.01"),
          })
        ).to.be.ok;
      }
      expect(await samplePrimarySaleErc721.withdrawNative()).to.be.ok;
      const finalBalance = await ethers.provider.getBalance(owner.address);

      expect(
        await ethers.provider.getBalance(
          "0x6c443510cF6a4a56341D4ce1aEA3B4399a14fBc7"
        )
      ).to.equal(BigInt(((5 * 10 ** 18) / 100) * 0.02));
    });

    it("Should split withdrawals to owner and imx wallet for erc20", async function () {
      const { samplePrimarySaleErc721, sampleImmutableERC20, owner } =
        await loadFixture(deployFixture);
      const initialBalance = await sampleImmutableERC20.balanceOf(
        owner.address
      );
      for (let i = 0; i < 5; i++) {
        expect(await samplePrimarySaleErc721.mintErc20()).to.be.ok;
      }
      expect(await samplePrimarySaleErc721.withdrawErc20()).to.be.ok;
      const finalBalance = await sampleImmutableERC20.balanceOf(owner.address);

      expect(initialBalance - finalBalance).to.equal(
        BigInt(((5 * 10 ** 18) / 100) * 0.02)
      );
      expect(
        await sampleImmutableERC20.balanceOf(
          "0x6c443510cF6a4a56341D4ce1aEA3B4399a14fBc7"
        )
      ).to.equal(BigInt(((5 * 10 ** 18) / 100) * 0.02));
    });
  });
});
