# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node # to test locally
npx hardhat ignition deploy ./ignition/modules/SamplePrimarySaleERC721.ts --network zkevm
npx hardhat verify --network zkevm ${CONTRACT_ADDRESS}
```