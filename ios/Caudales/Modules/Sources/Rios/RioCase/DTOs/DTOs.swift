import Foundation

struct RioDTO {
    let name: String?
    let sections: [SectionDTO]
}

extension RioDTO {
    init(with rio: Rio) {
        self.name = rio.name
        self.sections = rio.sections.map { SectionDTO(from: $0) }
    }
}

struct SectionDTO: Identifiable {
    let name: String
    let order: Int
    let levels: [LevelDTO]
    
    var id: String
}

extension SectionDTO {
    init(from section: Section) {
        self.name = section.name
        self.order = section.order
        self.levels = section.levels.map { LevelDTO(from: $0) }
        self.id = section.id
    }
}

struct LevelDTO: Identifiable {
    let date: String
    let valueTop: Int
    let valueBottom: Int?
    
    var id: String { date }
    
    init(from level: Level) {
        let sourceDateFormatter = DateFormatter()
        sourceDateFormatter.dateFormat = "yyyy-MM-dd"
        
        let presentedDateFormatter = DateFormatter()
        presentedDateFormatter.dateFormat = "dd/MM"
        
        if let levelDate = sourceDateFormatter.date(from: level.date) {
            let today = Date()
            let calendar = Calendar.current
            
            if calendar.isDate(levelDate, inSameDayAs: today) {
                self.date = "Hoy"
            } else {
                self.date = presentedDateFormatter.string(from: levelDate)
            }
        } else {
            self.date = level.date
        }
        
        switch level.type {
        case .programmed:
            self.valueTop = (level.max! + level.min!)/2
            self.valueBottom = level.min ?? 0
        case .dispensed:
            self.valueTop = Int(level.dispensed ?? "0") ?? 0
            self.valueBottom = nil
        }
    }
}
