import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SamplePrimarySaleERC721Module = buildModule(
  "SamplePrimarySaleERC721",
  (m) => {
    const samplePrimarySaleErc721 = m.contract("SamplePrimarySaleERC721");
    return { samplePrimarySaleErc721 };
  }
);

export default SamplePrimarySaleERC721Module;
