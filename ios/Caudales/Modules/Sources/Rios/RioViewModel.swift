import Foundation
import Observation

@Observable
public class RioViewModel {
    
    enum LevelDanger {
        case low, medium, high
    }
    
    public init() {
        self.rio = Sections.sectionsExample
    }
    
    var rio: Sections
    
    
    func colorForLevel(level: Level, section: Section) -> LevelDanger {
        let levelLow = section.absMin + (section.absMax - section.absMin) * 1/3
        let levelMid = section.absMax + (section.absMax - section.absMin) * 2/3
        let levelHigh = section.absMax
        let lvl = level.min ?? level.dispensed ?? 0
        return switch lvl {
        case ...levelLow: .low
        case levelLow ... levelMid: .medium
        case levelMid...: .high
        default: .high
        }
    }
    
    
}
