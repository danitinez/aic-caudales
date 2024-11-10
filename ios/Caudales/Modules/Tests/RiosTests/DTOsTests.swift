import XCTest
@testable import Rios

class DTOsTests: XCTestCase {
    
    func testRioDTOInitialization() {
        // Create dummy data
        let level1 = Level(type: .programmed, date: "2023-10-01", min: 10, max: 20, dispensed: nil)
        let level2 = Level(type: .dispensed, date: "2023-10-02", min: nil, max: nil, dispensed: "15")
        let section1 = Section(name: "Section 1", order: 1, levels: [level1, level2])
        let section2 = Section(name: "Section 2", order: 2, levels: [level1])
        
        let rio = Rio(version: "1.0", lastUpdate: "2023-10-03", name: "Test Rio", sections: [section1, section2])
        
        // Check the values
        XCTAssertEqual(rio.version, "1.0")
        XCTAssertEqual(rio.lastUpdate, "2023-10-03")
        XCTAssertEqual(rio.name, "Test Rio")
        XCTAssertEqual(rio.sections.count, 2)
        
        let firstSection = rio.sections[0]
        XCTAssertEqual(firstSection.name, "Section 1")
        XCTAssertEqual(firstSection.order, 1)
        XCTAssertEqual(firstSection.levels.count, 2)
        
        let firstLevel = firstSection.levels[0]
        XCTAssertEqual(firstLevel.type, .programmed)
        XCTAssertEqual(firstLevel.date, "2023-10-01")
        XCTAssertEqual(firstLevel.min, 10)
        XCTAssertEqual(firstLevel.max, 20)
        XCTAssertNil(firstLevel.dispensed)
        
        let secondLevel = firstSection.levels[1]
        XCTAssertEqual(secondLevel.type, .dispensed)
        XCTAssertEqual(secondLevel.date, "2023-10-02")
        XCTAssertNil(secondLevel.min)
        XCTAssertNil(secondLevel.max)
        XCTAssertEqual(secondLevel.dispensed, "15")
        
        let secondSection = rio.sections[1]
        XCTAssertEqual(secondSection.name, "Section 2")
        XCTAssertEqual(secondSection.order, 2)
        XCTAssertEqual(secondSection.levels.count, 1)
        
        let thirdLevel = secondSection.levels[0]
        XCTAssertEqual(thirdLevel.type, .programmed)
        XCTAssertEqual(thirdLevel.date, "2023-10-01")
        XCTAssertEqual(thirdLevel.min, 10)
        XCTAssertEqual(thirdLevel.max, 20)
        XCTAssertNil(thirdLevel.dispensed)
    }
    
    func testLoadRioInitialization() {
        let rio = Rio.loadSample()
        XCTAssertNotNil(rio)
    }
    
}
