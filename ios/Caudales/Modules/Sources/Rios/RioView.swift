import SwiftUI
import Charts


public struct RioView: View {
    @State private var viewmodel: RioViewModel
    
    public init(vm: RioViewModel) {
        self.viewmodel = vm
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
            Text(viewmodel.rio.name)
                .font(.title)
                .fontWeight(.bold)
                .padding(.horizontal)
            
            // Bar Chart
            Chart (viewmodel.rio.levels) { level in
                    BarMark(
                        x: .value("Day", level.dayToShow),
                        y: .value("Level", level.levelM3)
                    )
//                    .foregroundStyle(dangerToColor(dangerLevel: viewmodel.colorForLevel(level: level)))
                    .foregroundStyle(dangerToColor(value: level.dangerLevel))
                    .annotation(position: .overlay, alignment: .top) {
                        Text("\(level.levelM3)")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(.black)
                            
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
            .chartYScale(domain: 0...900)
            .chartXAxis {
                AxisMarks { value in
                    AxisValueLabel {
                        if let day = value.as(String.self) {
                            Text(day)
//                                .rotationEffect(.degrees(-45))
                        }
                    }
                }
            }
        }
        .padding(.all, 10)
        .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color(.systemGray6))
                )
    }
    
//    private func dangerToColor(dangerLevel: RioViewModel.LevelDanger) -> AnyGradient {
//        switch dangerLevel {
//        case .low: return Color.green.gradient
//        case .medium: return Color.yellow.gradient
//        case .high: return Color.red.gradient
//        }
//    }
    
    func dangerToColor(value: Double) -> Gradient {
        let green = 1 - value
        let red = value
        let color = Color(red: red, green: green, blue: 0)
        return Gradient(colors:[color, .green])
    }
    
    
}

// Preview provider for SwiftUI canvas
public struct RioView_Previews: PreviewProvider {
    public static var previews: some View {
        // Sample data for preview
        let vm = RioViewModel()
        RioView(vm: vm)
    }
}
