import Foundation

public struct Rio: Decodable {
    public init(name: String, levels: [Level]) {
        self.name = name
        self.levels = levels
    }
    let name: String
    let levels: [Level]
    
    
    
    static func createRio() -> Rio {
        // Create six dates starting from today, each one day apart
        let today = Date()
        let calendar = Calendar.current

        let levels = [
            Level(
                dayToShow: "Ayer",
                levelM3: 150
            ),
            Level(
                dayToShow: "Hoy",
                levelM3: 180
            ),
            Level(  
                dayToShow: "Mañ.",
                levelM3: 165
            ),
            Level(
                dayToShow: "22/10",
                levelM3: 200
            ),
            Level(
                dayToShow: "23/10",
                levelM3: 190
            ),
            Level(
                dayToShow: "24/10",
                levelM3: 170
            )
        ]

        return Rio(
            name: "Amazon River",
            levels: levels
        )
    }
}


