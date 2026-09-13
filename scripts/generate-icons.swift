// Generates Platewise's app icon, Android adaptive icon layers, splash image and the
// layers of the iOS 26 Icon Composer bundle.
//
//   swift scripts/generate-icons.swift
//
// The logo is a plate whose rim is a ring of green / orange / red arcs (a tiny "health chart").

import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let root = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
let images = root.appendingPathComponent("assets/images")
let iconBundle = root.appendingPathComponent("assets/platewise.icon")

// MARK: - Geometry (1024 × 1024 canvas)

typealias RGB = (r: Double, g: Double, b: Double)

let green: RGB = (48 / 255, 209 / 255, 88 / 255)
let orange: RGB = (255 / 255, 159 / 255, 10 / 255)
let red: RGB = (255 / 255, 69 / 255, 58 / 255)

let ringRadius = 300.0
let ringWidth = 88.0
let plateRadius = 200.0

struct Arc {
  let start: Double  // degrees, 0 = 3 o'clock, increasing clockwise (y-down)
  let span: Double
  let color: RGB
}

/// Arc spans leave room for the round caps so the visible gaps look equal.
let arcs: [Arc] = {
  let gap = 27.0
  var angle = -90.0 + gap / 2
  return [(150.0, green), (75.0, orange), (54.0, red)].map { span, color in
    defer { angle += span + gap }
    return Arc(start: angle, span: span, color: color)
  }
}()

func radians(_ degrees: Double) -> CGFloat { CGFloat(degrees * .pi / 180) }

// MARK: - PNG rendering

enum Style { case color, monochrome }

func makeContext(_ size: Int) -> CGContext {
  let ctx = CGContext(
    data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0,
    space: CGColorSpace(name: CGColorSpace.sRGB)!,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  // Flip to a y-down coordinate system so angles read clockwise like in SVG.
  ctx.translateBy(x: 0, y: CGFloat(size))
  ctx.scaleBy(x: 1, y: -1)
  return ctx
}

func color(_ c: RGB, _ alpha: Double = 1) -> CGColor {
  CGColor(srgbRed: c.r, green: c.g, blue: c.b, alpha: alpha)
}

func drawBackground(_ ctx: CGContext, size: Double) {
  let space = CGColorSpace(name: CGColorSpace.sRGB)!
  let base = CGGradient(
    colorsSpace: space,
    colors: [color((0.12, 0.13, 0.36)), color((0.02, 0.02, 0.05))] as CFArray,
    locations: [0, 1])!
  ctx.drawLinearGradient(base, start: .zero, end: CGPoint(x: size, y: size), options: [])

  func glow(_ c: RGB, _ alpha: Double, x: Double, y: Double, radius: Double) {
    let g = CGGradient(colorsSpace: space, colors: [color(c, alpha), color(c, 0)] as CFArray, locations: [0, 1])!
    let center = CGPoint(x: x * size, y: y * size)
    ctx.drawRadialGradient(g, startCenter: center, startRadius: 0, endCenter: center, endRadius: radius * size, options: [])
  }
  glow((0.42, 0.30, 1.0), 0.55, x: 0.2, y: 0.15, radius: 0.75)
  glow((0.12, 0.55, 1.0), 0.25, x: 0.9, y: 0.95, radius: 0.6)
}

func drawLogo(_ ctx: CGContext, size: Double, scale: Double, style: Style, glow: Bool) {
  let k = size / 1024 * scale
  let center = CGPoint(x: size / 2, y: size / 2)

  // Plate
  let plate = CGRect(
    x: center.x - plateRadius * k, y: center.y - plateRadius * k,
    width: 2 * plateRadius * k, height: 2 * plateRadius * k)
  switch style {
  case .color:
    ctx.saveGState()
    ctx.addEllipse(in: plate)
    ctx.clip()
    let sheen = CGGradient(
      colorsSpace: CGColorSpace(name: CGColorSpace.sRGB)!,
      colors: [CGColor(gray: 1, alpha: 0.24), CGColor(gray: 1, alpha: 0.06)] as CFArray,
      locations: [0, 1])!
    ctx.drawLinearGradient(sheen, start: CGPoint(x: plate.minX, y: plate.minY), end: CGPoint(x: plate.maxX, y: plate.maxY), options: [])
    ctx.restoreGState()
    ctx.setStrokeColor(CGColor(gray: 1, alpha: 0.35))
    ctx.setLineWidth(6 * k)
    ctx.strokeEllipse(in: plate)
  case .monochrome:
    ctx.setStrokeColor(CGColor(gray: 1, alpha: 1))
    ctx.setLineWidth(18 * k)
    ctx.strokeEllipse(in: plate.insetBy(dx: 9 * k, dy: 9 * k))
  }

  // Ring
  for arc in arcs {
    ctx.saveGState()
    if glow { ctx.setShadow(offset: .zero, blur: 56 * k, color: color(arc.color, 0.85)) }
    ctx.setStrokeColor(style == .monochrome ? CGColor(gray: 1, alpha: 1) : color(arc.color))
    ctx.setLineWidth(ringWidth * k)
    ctx.setLineCap(.round)
    ctx.addArc(
      center: center, radius: ringRadius * k,
      startAngle: radians(arc.start), endAngle: radians(arc.start + arc.span), clockwise: false)
    ctx.strokePath()
    ctx.restoreGState()
  }
}

func writePNG(_ ctx: CGContext, to url: URL) {
  let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(dest, ctx.makeImage()!, nil)
  precondition(CGImageDestinationFinalize(dest), "Failed to write \(url.path)")
  print("wrote", url.path.replacingOccurrences(of: root.path + "/", with: ""))
}

func render(_ name: String, size: Int = 1024, background: Bool, scale: Double, style: Style = .color, glow: Bool = true) {
  let ctx = makeContext(size)
  if background { drawBackground(ctx, size: Double(size)) }
  if scale > 0 { drawLogo(ctx, size: Double(size), scale: scale, style: style, glow: glow) }
  writePNG(ctx, to: images.appendingPathComponent(name))
}

// Full icon (Android legacy launchers, stores).
render("icon.png", background: true, scale: 1)
// Android adaptive icon: the launcher masks the layers; keep the logo inside the ~61% safe zone.
render("android-icon-background.png", background: true, scale: 0)
render("android-icon-foreground.png", background: false, scale: 0.78)
render("android-icon-monochrome.png", background: false, scale: 0.78, style: .monochrome, glow: false)
// Splash: logo only, shown centered on the dark splash background.
render("splash-icon.png", background: false, scale: 1)

// MARK: - iOS 26 Icon Composer layers (SVG)

func f(_ v: Double) -> String { String(format: "%.2f", v) }

func arcPath(_ arc: Arc) -> String {
  let c = 512.0
  func point(_ deg: Double) -> (Double, Double) {
    (c + ringRadius * cos(deg * .pi / 180), c + ringRadius * sin(deg * .pi / 180))
  }
  let (x0, y0) = point(arc.start)
  let (x1, y1) = point(arc.start + arc.span)
  let largeArc = arc.span > 180 ? 1 : 0
  return "M\(f(x0)) \(f(y0))A\(f(ringRadius)) \(f(ringRadius)) 0 \(largeArc) 1 \(f(x1)) \(f(y1))"
}

func hex(_ c: RGB) -> String {
  String(format: "#%02X%02X%02X", Int(c.r * 255), Int(c.g * 255), Int(c.b * 255))
}

let ringSVG = """
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  \(arcs.map { "<path d=\"\(arcPath($0))\" stroke=\"\(hex($0.color))\" stroke-width=\"\(f(ringWidth))\" stroke-linecap=\"round\"/>" }.joined(separator: "\n"))
  </svg>

  """

let plateSVG = """
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="512" cy="512" r="\(f(plateRadius))" fill="white"/>
  </svg>

  """

let assets = iconBundle.appendingPathComponent("Assets")
try FileManager.default.createDirectory(at: assets, withIntermediateDirectories: true)
try ringSVG.write(to: assets.appendingPathComponent("ring.svg"), atomically: true, encoding: .utf8)
try plateSVG.write(to: assets.appendingPathComponent("plate.svg"), atomically: true, encoding: .utf8)
print("wrote assets/platewise.icon/Assets/{ring,plate}.svg")
