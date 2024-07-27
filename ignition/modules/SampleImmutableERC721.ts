import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SampleImmutableERC721Module = buildModule(
  "SampleImmutableERC721Module",
  (m) => {
    const sampleImmutableERC721Module = m.contract(
      "SampleImmutableERC721Module"
    );
    return { sampleImmutableERC721Module };
  }
);

export default SampleImmutableERC721Module;
