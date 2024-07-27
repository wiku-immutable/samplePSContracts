// SPDX-License-Identifier: MIT License
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IIERC721 {
    function safeMint(address to, uint256 tokenId) external;
}

contract SamplePrimarySaleERC721 is Ownable, ReentrancyGuard {
    uint public constant ALLOCATION = 5; // Maximum mint per wallet
    uint public constant maxSupply = 250;
    uint public totalMinted; // tracks tokenIds
    bool public isStarted;
    mapping(address => bool) public whitelist;
    mapping(address => uint) public minted;

    // Deployed ERC721 collection
    IIERC721 public erc721;

    // Variables below are to change for mint
    // Immutable address to obtain % of sale token and price (default 2%)
    address payable public imx =
        payable(0x6c443510cF6a4a56341D4ce1aEA3B4399a14fBc7);
    uint public imxShare = 2;

    // Chosen ERC20 for payment (default USDC)
    // Address obtained here: https://docs.immutable.com/platform/zkEVM/addresses#token-addresses
    IERC20 public erc20 = IERC20(0x3B2d8A1931736Fc321C24864BceEe981B11c3c57);
    uint public erc20Decimals = 6;

    modifier onlyWhitelisted() {
        require(whitelist[msg.sender], "User is not whitelisted");
        _;
    }

    constructor() {}

    function addToWhitelist(address _address) public onlyOwner {
        whitelist[_address] = true;
    }

    function removeFromWhitelist(address _address) public onlyOwner {
        whitelist[_address] = false;
    }

    // Used for testing purposes.
    function clearMinted(address _address) public onlyOwner {
        delete minted[_address];
    }

    // Public mint functions. Maximum 5 mints allowed (unless cleared).

    function mintFree() public nonReentrant {
        require(isStarted, "Sale has not started");
        require(totalMinted < maxSupply, "Mint limit reached");
        require(minted[msg.sender] < ALLOCATION, "Minted too many times");
        ++minted[msg.sender];
        ++totalMinted;
        erc721.safeMint(msg.sender, totalMinted);
    }

    function mintNative() public payable nonReentrant {
        uint mintPriceNative = 10 ** 18 / 100; // 0.01 $IMX as example
        require(isStarted, "Sale has not started");
        require(totalMinted < maxSupply, "Mint limit reached");
        require(minted[msg.sender] < ALLOCATION, "Minted too many times");
        require(msg.value == mintPriceNative, "Insufficient IMX");
        ++minted[msg.sender];
        ++totalMinted;
        erc721.safeMint(msg.sender, totalMinted);
    }

    function mintErc20() public nonReentrant {
        uint mintPriceErc20 = 10 ** erc20Decimals / 100; // 0.01 $USDC as example
        require(isStarted, "Sale has not started");
        require(totalMinted < maxSupply, "Mint limit reached");
        require(minted[msg.sender] < ALLOCATION, "Minted too many times");
        ++minted[msg.sender];
        ++totalMinted;
        bool success = erc20.transferFrom(
            msg.sender,
            address(this),
            mintPriceErc20
        );
        require(success, "Token transfer failed");
        erc721.safeMint(msg.sender, totalMinted);
    }

    // Whitelisted mint functions. Unlimited mints allowed.

    function mintFreeWL() public nonReentrant onlyWhitelisted {
        require(isStarted, "Sale has not started");
        require(totalMinted < maxSupply, "Mint limit reached");
        ++totalMinted;
        erc721.safeMint(msg.sender, totalMinted);
    }

    function mintNativeWL() public payable nonReentrant onlyWhitelisted {
        uint mintPriceNative = 10 ** 18 / 100; // 0.01 $IMX as example
        require(isStarted, "Sale has not started");
        require(totalMinted < maxSupply, "Mint limit reached");
        require(msg.value == mintPriceNative, "Insufficient IMX");
        ++totalMinted;
        erc721.safeMint(msg.sender, totalMinted);
    }

    function mintErc20WL() public nonReentrant onlyWhitelisted {
        uint mintPriceErc20 = 10 ** erc20Decimals / 100; // 0.01 $USDC as example
        require(isStarted, "Sale has not started");
        require(totalMinted < maxSupply, "Mint limit reached");
        ++totalMinted;
        bool success = erc20.transferFrom(
            msg.sender,
            address(this),
            mintPriceErc20
        );
        require(success, "Token transfer failed");
        erc721.safeMint(msg.sender, totalMinted);
    }

    receive() external payable {}

    function setErc721(address _erc721) external onlyOwner {
        require(address(_erc721) != address(0), "Invalid ERC721 address");
        erc721 = IIERC721(_erc721);
    }

    function setErc20(address _erc20, uint _decimals) external onlyOwner {
        require(address(_erc20) != address(0), "Invalid ERC721 address");
        erc20Decimals = _decimals;
        erc20 = IERC20(_erc20);
    }

    function setImx(address _imx) external onlyOwner {
        require(address(_imx) != address(0), "Invalid recipient address");
        imx = payable(_imx);
    }

    function startSale() external onlyOwner {
        require(!isStarted, "Sale already started");
        require(address(erc721) != address(0), "No ERC721 for sale");
        isStarted = true;
    }

    function stopSale() external onlyOwner {
        require(isStarted, "Sale already stopped");
        isStarted = false;
    }

    function withdrawNative() external onlyOwner {
        imxShare = (address(this).balance * imxShare) / 100;
        (bool sentOwner, ) = payable(msg.sender).call{
            value: address(this).balance - imxShare
        }("");
        (bool sentImx, ) = imx.call{value: imxShare}("");
        require(sentOwner && sentImx, "Withdraw failed");
    }

    function withdrawErc20() external onlyOwner {
        imxShare = (erc20.balanceOf(address(this)) * imxShare) / 100;
        bool sentOwner = erc20.transfer(
            msg.sender,
            erc20.balanceOf(address(this)) - imxShare
        );
        bool sentImx = erc20.transfer(imx, imxShare);
        require(sentOwner && sentImx, "Withdraw failed");
    }
}
