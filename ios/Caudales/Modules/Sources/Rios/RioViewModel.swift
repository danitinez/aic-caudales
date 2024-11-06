import Foundation
import Observation
import AicNetwork

@Observable
public class RioViewModel {
    
    private let network: NetworkServiceProtocol
    var rio: Sections?
    
    enum LevelDanger {
        case low, medium, high
    }
    
    public init() {
        self.network = NetworkService()
    }
    
    func loadRio() async {
        do {
            let rio: Sections = try await self.network.execute(endpoint: AicNetwork.APIEndpoints.getData(parameters: nil))
            print(rio)
            self.rio = rio
        } catch {
            print("Error loading Rio data: \(error)")
        }
    }
    
    
    
//    
//    func colorForLevel(level: Level, section: Section) -> LevelDanger {
//        let levelLow = section.absMin + (section.absMax - section.absMin) * 1/3
//        let levelMid = section.absMax + (section.absMax - section.absMin) * 2/3
//        let levelHigh = section.absMax
//        let lvl = level.min ?? level.dispensed ?? 0
//        return switch lvl {
//        case ...levelLow: .low
//        case levelLow ... levelMid: .medium
//        case levelMid...: .high
//        default: .high
//        }
//    }
    
    
}
