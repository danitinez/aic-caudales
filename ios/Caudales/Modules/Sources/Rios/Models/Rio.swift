import Foundation

struct Rio: Decodable {
    init(name: String, min: Int, max: Int, levels: [Level] = []) {
        self.name = name
        self.levels = levels
        self.min = min
        self.max = max
    }
    
    let name: String
    let min: Int
    let max: Int
    var levels: [Level]
    
    
    static func createRio() -> Rio {
        // Create six dates starting from today, each one day apart
        let today = Date()
        let calendar = Calendar.current
        var rio = Rio(
            name: "Amazon River",
            min: 150,
            max: 900
        )
        
        let levels = [
            Level(
                dayToShow: "Ayer",
                levelM3: 150,
                rio: rio
            ),
            Level(
                dayToShow: "Hoy",
                levelM3: 310,
                rio: rio
            ),
            Level(  
                dayToShow: "Mañ.",
                levelM3: 450,
                rio: rio
            ),
            Level(
                dayToShow: "22/10",
                levelM3: 700,
                rio: rio
            ),
            Level(
                dayToShow: "23/10",
                levelM3: 900,
                rio: rio
            ),
            Level(
                dayToShow: "24/10",
                levelM3: 900,
                rio: rio
            )
        ]

        rio.levels = levels
        
        return rio
    }
}


