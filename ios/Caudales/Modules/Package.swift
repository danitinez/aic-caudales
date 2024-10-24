// swift-tools-version: 6.0
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "Modules",
    platforms: [
           .iOS(.v16),
           // You can also specify other platforms if needed:
           // .macOS(.v13),
           // .watchOS(.v9),
           // .tvOS(.v16)
       ],
    products: [
        // Products define the executables and libraries a package produces, making them visible to other packages.
//        .library(
//            name: "UI",
//            targets: ["UI"]),
    ],
    targets: [
        // Targets are the basic building blocks of a package, defining a module or a test suite.
        // Targets can depend on other targets in this package and products from dependencies.
        .target(
            name: "UI"),
        .testTarget(
            name: "UITests",
            dependencies: ["UI"]
        ),
    ]
)
