/**
 * tests/helpers/db.js
 *
 * No-op stubs — kept so test files can import connect/disconnect without error.
 * Actual DB is mocked at the model level via jest.mock() in each test file.
 */
async function connect()           {}
async function disconnect()        {}
async function clearCollections()  {}

module.exports = { connect, disconnect, clearCollections };
