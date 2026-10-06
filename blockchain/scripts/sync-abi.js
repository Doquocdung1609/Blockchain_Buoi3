const fs = require("fs");
const path = require("path");

const source = path.join(
  __dirname,
  "..",
  "artifacts",
  "contracts",
  "DominionDAO.sol",
  "DominionDAO.json"
);
const destination = path.join(
  __dirname,
  "..",
  "..",
  "frontend",
  "src",
  "abis",
  "DominionDAO.json"
);

if (!fs.existsSync(source)) {
  throw new Error("DominionDAO artifact not found. Run npm run compile first.");
}

fs.mkdirSync(path.dirname(destination), { recursive: true });
const artifact = JSON.parse(fs.readFileSync(source, "utf8"));
fs.writeFileSync(
  destination,
  `${JSON.stringify(
    {
      contractName: artifact.contractName,
      sourceName: artifact.sourceName,
      abi: artifact.abi,
    },
    null,
    2
  )}\n`
);

console.log(`ABI copied to ${destination}`);
