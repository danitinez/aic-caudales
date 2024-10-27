import Foundation
import Observation

@Observable
public class RioViewModel {
    
    enum LevelDanger {
        case low, medium, high
    }
    
    public init() {
        self.rio = Rio.createRio()
    }
    
    var rio: Rio
    
    
    func colorForLevel(level: Level) -> LevelDanger {
        let levelLow = rio.min + (rio.max - rio.min) * 1/3
        let levelMid = rio.min + (rio.max - rio.min) * 2/3
        let levelHigh = rio.max
        return switch level.levelM3 {
        case ...levelLow: .low
        case levelLow ... levelMid: .medium
        case levelMid...: .high
        default: .high
        }
    }
    
    
}
