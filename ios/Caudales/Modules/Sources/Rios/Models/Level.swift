import Foundation

public struct Level: Decodable, Identifiable {
    public init(dayToShow: String, levelM3: Int, rio: Rio) {
        self.dayToShow = dayToShow
        self.levelM3 = levelM3
        self.id = dayToShow
        self.rio = rio
    }
    public var id: String
    let dayToShow: String
    let levelM3: Int
    let rio: Rio
    
    var dangerLevel: Double {
        let lvl = Double(levelM3 - rio.min)/Double(rio.max - rio.min)
        return max(0, min(lvl, 1))
    }
}
