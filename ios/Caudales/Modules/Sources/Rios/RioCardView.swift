import SwiftUI
import Charts


public struct RioCardView: View {
    let viewmodel: RioViewModel
    
    public init(viewmodel: RioViewModel) {
        self.viewmodel = viewmodel
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Title
            Text(viewmodel.rio.name)
                .font(.title)
                .fontWeight(.bold)
                .padding(.horizontal)
            
            // Chart
            ForEach(viewmodel.rio.sections) { section in
                RioChartView(levels: section.levels)
                    .frame(height: 200)
            }
        }
        .padding(.all, 10)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemGray6))
        )
    }
}

struct RioChartView: View {
    let levels: [Level]  // Assuming this is your data model
    
    var formatter:Formatter {
        let formatter = DateFormatter()
        formatter.dateFormat = "dd/MM"
        return formatter
    }
    
    
    func dangerToColor(value: Double) -> Gradient {
       let green = 1 - value
       let red = value
       let color = Color(red: red, green: green, blue: 0)
       return Gradient(colors:[color, .green])
   }
    
    var body: some View {
        Chart(levels) { level in
            BarMark(
                x: .value("Day", formatter.string(for: level.date)!),
                y: .value("Level", level.min ?? 0)
            )
            .foregroundStyle(Color.red)
            .annotation(position: .overlay, alignment: .top) {
                Text("\(level.min ?? 0)")
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
    
}

//
//public struct RioView: View {
//    @State private var viewmodel: RioViewModel
//    
//    public init(vm: RioViewModel) {
//        self.viewmodel = vm
//    }
//    
//    // Date formatter for x-axis labels
//    private let dateFormatter: DateFormatter = {
//        let formatter = DateFormatter()
//        formatter.dateFormat = "dd/MM"
//        return formatter
//    }()
//    
//    public var body: some View {
//        VStack(alignment: .leading, spacing: 16) {
//            // Title
//            Text(viewmodel.rio.name)
//                .font(.title)
//                .fontWeight(.bold)
//                .padding(.horizontal)
//            
//            // Bar Chart
//            Chart(viewmodel.rio.levels) { level in
//                let xValue = PlottableValue<String>("Day", level.dayToShow)
//                let yValue = PlottableValue<Double>("Level", level.levelM3)
//                let barColor = dangerToColor(value: level.dangerLevel)
//
//                BarMark(
//                    x: xValue,
//                    y: yValue
//                )
//                .foregroundStyle(barColor)
//                .annotation(position: .overlay, alignment: .top) {
//                    Text("\(level.levelM3)")
//                        .font(.system(size: 12, weight: .medium))
//                        .foregroundStyle(.black)
//                }
//            }
//            .chartYAxis {
//                AxisMarks(position: .leading) { value in
//                    if let level = value.as(Int.self) {
//                        AxisValueLabel {
//                            Text("\(level)m³")
//                        }
//                    }
//                }
//            }
//            .chartYScale(domain: 0...900)
//            .chartXAxis {
//                AxisMarks { value in
//                    if let day = value.as(String.self) {
//                        AxisValueLabel {
//                            Text(day)
//                        }
//                    }
//                }
//            }
//        }
//        .padding(.all, 10)
//        .background(
//            RoundedRectangle(cornerRadius: 16)
//                .fill(Color(.systemGray6))
//        )
//    }
//
//    
//    func dangerToColor(value: Double) -> Gradient {
//        let green = 1 - value
//        let red = value
//        let color = Color(red: red, green: green, blue: 0)
//        return Gradient(colors:[color, .green])
//    }
//    
//    
//}

// Preview provider for SwiftUI canvas
public struct RioView_Previews: PreviewProvider {
    public static var previews: some View {
        // Sample data for preview
        let vm = RioViewModel()
        RioCardView(viewmodel: vm)
    }
}