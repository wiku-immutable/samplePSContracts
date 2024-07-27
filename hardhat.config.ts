import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  // https://docs.blockscout.com/for-users/verifying-a-smart-contract/hardhat-verification-plugin#config-file-and-unsupported-networks
  etherscan: {
    apiKey: {
      zkevm: "xyz",
    },
    customChains: [
      {
        network: "zkevm",
        chainId: 13473,
        urls: {
          apiURL: "https://explorer.testnet.immutable.com/api",
          browserURL: "https://explorer.testnet.immutable.com/",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
  networks: {
    localhost: {
      url: `http://127.0.0.1:8545/`,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    zkevm: {
      url: `https://rpc.testnet.immutable.com`,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

export default config;
