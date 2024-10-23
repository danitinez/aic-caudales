import SwiftUI
import Charts

public struct Rio: Decodable {
    public init(name: String, levels: [Level]) {
        self.name = name
        self.levels = levels
    }
    let name: String
    let levels: [Level]
}

public struct Level: Decodable {
    public init(day: Date, levelM3: Int) {
        self.day = day
        self.levelM3 = levelM3
    }
    let day: Date
    let levelM3: Int
}


public struct RioView: View {
    let rio: Rio
    
    public init(rio: Rio) {
        self.rio = rio
    }
    
    // Date formatter for x-axis labels
    private let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "dd/MM"
        return formatter
    }()
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Title
            Text(rio.name)
                .font(.title)
                .fontWeight(.bold)
                .padding(.horizontal)
            
            // Bar Chart
            Chart {
                ForEach(rio.levels, id: \.day) { level in
                    BarMark(
                        x: .value("Day", dateFormatter.string(from: level.day)),
                        y: .value("Level", level.levelM3)
                    )
                    .foregroundStyle(Color.blue.gradient)
                }
            }
            .frame(height: 300)
            .padding()
            .chartYAxis {
                AxisMarks(position: .leading) { value in
                    AxisValueLabel {
                        if let level = value.as(Int.self) {
                            Text("\(level)m³")
                        }
                    }
                }
            }
            .chartXAxis {
                AxisMarks { value in
                    AxisValueLabel {
                        if let day = value.as(String.self) {
                            Text(day)
                                .rotationEffect(.degrees(-45))
                        }
                    }
                }
            }
        }
        .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color(.systemGray6))
                )
    }
}

// Preview provider for SwiftUI canvas
public struct RioView_Previews: PreviewProvider {
    public static var previews: some View {
        // Sample data for preview
        let sampleLevels = [
            Level(day: Date(), levelM3: 100),
            Level(day: Date().addingTimeInterval(86400), levelM3: 150),
            Level(day: Date().addingTimeInterval(172800), levelM3: 120),
            Level(day: Date().addingTimeInterval(259200), levelM3: 180)
        ]
        let sampleRio = Rio(name: "Amazon River", levels: sampleLevels)
        
        RioView(rio: sampleRio)
    }
}
