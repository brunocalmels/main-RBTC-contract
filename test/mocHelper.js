const flat = require('flat');

const { createBaseContracts } = require('./testHelpers/contractsBuilder');
const functionHelper = require('./testHelpers/functionHelper');
const precisionHelper = require('./testHelpers/precisionHelper');
const assertsHelper = require('./testHelpers/assertsHelper');
const networkFunctions = require('./testHelpers/networkHelper');
const eventsFunctions = require('./testHelpers/eventsHelper');
const { toContractBN } = require('./testHelpers/formatHelper');

const BUCKET_C0 = web3.utils.asciiToHex('C0', 32);
const BUCKET_X2 = web3.utils.asciiToHex('X2', 32);

const UINT_MAX_VALUE = 2 ** 256 - 1;

const getContractReadyState = (unitsMapping, unitsPrecision) => state => {
  const flatted = flat(state);
  const transform = toContractBN(unitsPrecision);
  const getPrecisionString = key =>
    unitsMapping[
      key
        .split('.')
        .reverse()
        .find(it => it in unitsMapping)
    ];
  const transformed = Object.keys(flatted).reduce((_acum, key) => {
    // Infinity doesn't have precision
    const value =
      flatted[key] === '∞'
        ? UINT_MAX_VALUE
        : transform(flatted[key], getPrecisionString(key)).toString();
    return {
      ..._acum,
      [key]: value
    };
  }, {});

  return flat.unflatten(transformed);
};

module.exports = async ({ owner, useMock }) => {
  const contracts = await createBaseContracts({
    owner,
    useMock
  });

  const { saveState } = networkFunctions;
  // Fix snapshot after moc deploy
  await saveState();
  const mocFunctions = await functionHelper(contracts);
  const precisions = await precisionHelper(contracts.moc);
  const asserts = await assertsHelper(precisions);

  return {
    BUCKET_C0,
    BUCKET_X2,
    toContractBN: toContractBN(precisions.unitsPrecision),
    getContractReadyState: getContractReadyState(
      precisions.unitsMapping,
      precisions.unitsPrecision
    ),
    ...networkFunctions,
    ...asserts,
    ...contracts,
    ...precisions,
    ...mocFunctions,
    ...eventsFunctions
  };
};
