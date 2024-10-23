import SwiftUI
import UI

struct ContentView: View {

    var body: some View {
        RioView(rio: createRio())
    }
    
    func createRio() -> Rio {
        // Create six dates starting from today, each one day apart
        let today = Date()
        let calendar = Calendar.current

        let levels = [
            Level(
                day: today,
                levelM3: 150
            ),
            Level(
                day: calendar.date(byAdding: .day, value: 1, to: today)!,
                levelM3: 180
            ),
            Level(
                day: calendar.date(byAdding: .day, value: 2, to: today)!,
                levelM3: 165
            ),
            Level(
                day: calendar.date(byAdding: .day, value: 3, to: today)!,
                levelM3: 200
            ),
            Level(
                day: calendar.date(byAdding: .day, value: 4, to: today)!,
                levelM3: 190
            ),
            Level(
                day: calendar.date(byAdding: .day, value: 5, to: today)!,
                levelM3: 170
            )
        ]

        return Rio(
            name: "Amazon River",
            levels: levels
        )
    }
}

#Preview {
    ContentView()
}
