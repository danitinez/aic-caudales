import Testing
@testable import Rios

@Test func example() async throws {
    // Write your test here and use APIs like `#expect(...)` to check expected conditions.
    
}

@Test func dangerLevel() {
    // Given
   let rio = Rio(name: "Test River", min: 100, max: 200)
   
   // Test cases with different water levels
   let testCases = [
       (level: 100, expected: 0.0),  // Minimum level
       (level: 150, expected: 0.5),  // Middle level
       (level: 200, expected: 1.0),  // Maximum level
       (level: 50, expected: 0.0),   // Below minimum
       (level: 250, expected: 1.0)   // Above maximum
   ]
   
   for testCase in testCases {
       // When
       let level = Level(dayToShow: "2024-10-27",
                       levelM3: testCase.level,
                       rio: rio)
       
       // Then
       #expect(level.dangerLevel == testCase.expected,
               "For level \(testCase.level), expected danger level \(testCase.expected), but got \(level.dangerLevel)")
   }
}
