import Foundation

struct Sections: Codable {
    let version: String
//    let last_update: String
    let name: String? = "Limay"
    let sections: [Section]
    
//    enum CodingKeys: String, CodingKey {
//        case version
//        case last_update
//        case name
//        case sections
//    }
}

struct Section: Codable, Identifiable {
    let name: String
    let order: Int
    let levels: [Level]
    
    var id:String { name }
}

struct Level: Codable, Identifiable {
    let type: String
    let date: String
    let min: Int?
    let max: Int?
    let dispensed: String?
    
    var id: String { date }
}



//
//
//struct Sections: Decodable {
//    let version: String
//    let name: String
//    let lastUpdate: Date
//    let sections: [Section]
//    
//    static let sectionsExample = Sections(
//        version: "1.0",
//        name: "Limay",
//        lastUpdate: Date(),
//        sections: [
//            Section(
//                name: "Section 1",
//                order: 1,
//                absMax: 15,
//                absMin: 5,
//                levels: [
//                    Level(
//                        type: "Type 1",
//                        date: Calendar.current.date(byAdding: .day, value: 1, to: Date())!,
//                        min: 420,
//                        max: 580,
//                        dispensed: 500
//                    ),
//                    Level(
//                        type: "Type 2",
//                        date: Calendar.current.date(byAdding: .day, value: 2, to: Date())!,
//                        min: 445,
//                        max: 565,
//                        dispensed: 505
//                    ),
//                    Level(
//                        type: "Type 1",
//                        date: Calendar.current.date(byAdding: .day, value: 3, to: Date())!,
//                        min: 430,
//                        max: 590,
//                        dispensed: 510
//                    ),
//                    Level(
//                        type: "Type 2",
//                        date: Calendar.current.date(byAdding: .day, value: 4, to: Date())!,
//                        min: 410,
//                        max: 570,
//                        dispensed: 490
//                    ),
//                    Level(
//                        type: "Type 1",
//                        date: Calendar.current.date(byAdding: .day, value: 5, to: Date())!,
//                        min: 435,
//                        max: 585,
//                        dispensed: 515
//                    ),
//                    Level(
//                        type: "Type 2",
//                        date: Calendar.current.date(byAdding: .day, value: 6, to: Date())!,
//                        min: 425,
//                        max: 575,
//                        dispensed: 500
//                    )
//                ]
//            )
//        ]
//    )
//}
//
//
