import Foundation
import Observation
import AicNetwork

@Observable
public class RioViewModel {
    
    private let network: NetworkServiceProtocol
    var rio: RioDTO?
    
    enum LevelDanger {
        case low, medium, high
    }
    
    public init() {
        self.network = NetworkService()
    }
    
    init(rio: Rio?) {
        self.network = NetworkService()
        guard let rio = rio else { return }
        self.rio = RioDTO(with: rio)
    }
    
    func loadRio() async {
        do {
            let rio: Rio = try await self.network.execute(endpoint: APIEndpoints.getData(parameters: nil))
//            print(rio)
            self.rio = RioDTO(with: rio)
        } catch let error as NetworkError {
            switch error {
            case let .decodingError(decodingError):
                print("Decoding error: \(decodingError)")
            default:
                print("Error loading Rio data: \(error.localizedDescription)")
            }
        } catch {
            print("Error loading Rio data: \(error.localizedDescription)")
        }
        
    }
    
    
    func formatDate(_ date: String) {
        var formatter:Formatter {
            let formatter = DateFormatter()
            formatter.dateFormat = "dd/MM"
            return formatter
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
