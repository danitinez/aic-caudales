import Foundation

public struct Level: Decodable, Identifiable {
    public var id: String
    
    public init(dayToShow: String, levelM3: Int) {
        self.dayToShow = dayToShow
        self.levelM3 = levelM3
        self.id = dayToShow
    }
    let dayToShow: String
    let levelM3: Int
}
