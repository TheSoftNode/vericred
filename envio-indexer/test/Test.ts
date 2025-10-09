import assert from "assert";
import { 
  TestHelpers,
  CredentialRegistry_AttributeSet
} from "generated";
const { MockDb, CredentialRegistry } = TestHelpers;

describe("CredentialRegistry contract AttributeSet event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for CredentialRegistry contract AttributeSet event
  const event = CredentialRegistry.AttributeSet.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("CredentialRegistry_AttributeSet is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await CredentialRegistry.AttributeSet.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualCredentialRegistryAttributeSet = mockDbUpdated.entities.CredentialRegistry_AttributeSet.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedCredentialRegistryAttributeSet: CredentialRegistry_AttributeSet = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      tokenId: event.params.tokenId,
      attributeKey: event.params.attributeKey,
      attributeValue: event.params.attributeValue,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualCredentialRegistryAttributeSet, expectedCredentialRegistryAttributeSet, "Actual CredentialRegistryAttributeSet should be the same as the expectedCredentialRegistryAttributeSet");
  });
});
