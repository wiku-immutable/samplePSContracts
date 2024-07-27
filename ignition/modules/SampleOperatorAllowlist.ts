import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SampleOperatorAllowlistModule = buildModule(
  "SampleOperatorAllowlist",
  (m) => {
    const sampleOperatorAllowlist = m.contract("SampleOperatorAllowlist");
    return { sampleOperatorAllowlist };
  }
);

export default SampleOperatorAllowlistModule;
