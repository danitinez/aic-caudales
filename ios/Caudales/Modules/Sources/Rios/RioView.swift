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
                    .foregroundStyle(Color.blue.gradient)
                    .annotation(position: .overlay, alignment: .top) {
                        Text("\(level.levelM3)")
                            .font(.system(size: 12, weight: .thin))
                            .foregroundStyle(.white)
                            
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
}

// Preview provider for SwiftUI canvas
public struct RioView_Previews: PreviewProvider {
    public static var previews: some View {
        // Sample data for preview
        let sampleLevels = [
            Level(dayToShow: "ayer", levelM3: 100),
            Level(dayToShow: "hoy",levelM3: 150),
            Level(dayToShow: "mañana", levelM3: 110),
            Level(dayToShow: "22/12", levelM3: 180)
        ]
        let sampleRio = Rio(name: "Amazon River", levels: sampleLevels)
        
        let vm = RioViewModel()
        RioView(vm: vm)
    }
}
