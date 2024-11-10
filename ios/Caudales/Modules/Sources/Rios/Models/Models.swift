import Foundation

struct Rio: Decodable {
    let version: String
    let lastUpdate: String
    let name: String?
    let sections: [Section]
}

// Rio Extension for JSON Loading
extension Rio {
    static func loadSample() -> Rio? {
            guard let url = Bundle.module.url(forResource: "sample", withExtension: "json", subdirectory: "ResourcesData"),
                  let data = try? Data(contentsOf: url) else {
                return nil
            }
            
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            return try? decoder.decode(Rio.self, from: data)
        }
}


struct Section: Decodable, Identifiable {
    let name: String
    let order: Int
    let levels: [Level]
    
    var id:String { name }
}

struct Level: Decodable, Identifiable {
    let type: LevelType
    let date: String
    let min: Int?
    let max: Int?
    let dispensed: String?
    
    var id: String { date }
}

enum LevelType: String, Decodable {
    case programmed
    case dispensed
}
