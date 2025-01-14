import SwiftUI
import Charts

struct LevelsView: View {
    let levels: [LevelDTO]  // Assuming this is your data model
    
    func dangerToColor(value: Double) -> Gradient {
       let green = 1 - value
       let red = value
       let color = Color(red: red, green: green, blue: 0)
       return Gradient(colors:[color, .green])
   }
    
    var body: some View {
        VStack {
            Chart(levels) { level in
                BarMark(
                    //                x: .value("Day", formatter.string(for: level.date)!),
                    x: .value("Day", level.date),
                    y: .value("Level", level.valueTop)
                )
                .foregroundStyle(Color.blue.gradient)
                .clipShape(RoundedRectangle(cornerRadius: 4))
                .annotation(position: .overlay, alignment: .top) {
                    Text("\(level.valueTop)")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.black)
                }
            }
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
                        }
                    }
                }
            }
        }
        .padding(.all, 20)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemGray6))
        )
        
    }
    
}

// Preview provider for SwiftUI canvas
public struct LevelsView_Previews: PreviewProvider {
    public static var previews: some View {
        // Sample data for preview
        let levels = Rio.loadSample()!.sections[2].levels
        
        return LevelsView(levels: levels.map{ LevelDTO(from: $0) })
            .frame(minWidth: 400, maxWidth: .infinity, minHeight: 300, maxHeight: 400)
    }
}

// Preview provider for SwiftUI canvas for dark mode
public struct LevelsViewDark_Previews: PreviewProvider {
    public static var previews: some View {
        
        let levels = Rio.loadSample()!.sections[2].levels
                let levelsView = LevelsView(levels: levels.map{ LevelDTO(from: $0) })
                    .frame(minWidth: 400, maxWidth: .infinity, minHeight: 300, maxHeight: 400)
                
                Group {
                    levelsView
                        .preferredColorScheme(.light)
                        .previewDisplayName("Light Mode")
                    
                    levelsView
                        .preferredColorScheme(.dark)
                        .previewDisplayName("Dark Mode")
                }
    }
}
