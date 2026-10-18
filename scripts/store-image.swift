// Prepares an image for the stores: both App Store Connect and Play Console reject alpha channels,
// so the output is an opaque RGB PNG. With a size, the image is scaled to fit (aspect kept) and
// centered on the app background color, e.g. Android screenshots framed to 9:16 for Play.
//
//   swift scripts/store-image.swift <in.png> <out.png> [WIDTHxHEIGHT]
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let args = Array(CommandLine.arguments.dropFirst())
guard args.count == 2 || args.count == 3 else {
  print("usage: swift scripts/store-image.swift <in.png> <out.png> [WIDTHxHEIGHT]")
  exit(1)
}
let input = URL(fileURLWithPath: args[0])
let output = URL(fileURLWithPath: args[1])

guard let source = CGImageSourceCreateWithURL(input as CFURL, nil),
  let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
else {
  print("can't read \(input.path)")
  exit(1)
}

var width = image.width
var height = image.height
if args.count == 3 {
  let parts = args[2].split(separator: "x").compactMap { Int($0) }
  guard parts.count == 2 else {
    print("size must look like 1080x1920")
    exit(1)
  }
  (width, height) = (parts[0], parts[1])
}

let ctx = CGContext(
  data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0,
  space: CGColorSpace(name: CGColorSpace.sRGB)!,
  bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
ctx.interpolationQuality = .high
// App background (#05060A), also what shows around a fitted image.
ctx.setFillColor(CGColor(srgbRed: 5 / 255, green: 6 / 255, blue: 10 / 255, alpha: 1))
ctx.fill(CGRect(x: 0, y: 0, width: width, height: height))

let scale = min(Double(width) / Double(image.width), Double(height) / Double(image.height))
let drawWidth = Double(image.width) * scale
let drawHeight = Double(image.height) * scale
ctx.draw(
  image,
  in: CGRect(
    x: (Double(width) - drawWidth) / 2, y: (Double(height) - drawHeight) / 2, width: drawWidth,
    height: drawHeight))

let dest = CGImageDestinationCreateWithURL(output as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, ctx.makeImage()!, nil)
guard CGImageDestinationFinalize(dest) else {
  print("can't write \(output.path)")
  exit(1)
}
print("wrote \(output.path) (\(width)x\(height), no alpha)")
