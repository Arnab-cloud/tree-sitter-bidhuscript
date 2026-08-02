import XCTest
import SwiftTreeSitter
import TreeSitterBidhuscript

final class TreeSitterBidhuscriptTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_bidhuscript())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading BidhuScript grammar")
    }
}
