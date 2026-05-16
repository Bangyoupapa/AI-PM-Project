import { describe, it, expect } from "vitest";
import { chunkText } from "@/lib/rag/chunkText";

describe("chunkText", () => {
  it("returns one chunk when text is shorter than chunkSize", () => {
    const chunks = chunkText("hello world", 500, 100);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe("hello world");
  });

  it("splits long text into multiple chunks based on chunkSize", () => {
    // 10 words, chunkSize=4, overlap=0 → ceil(10/4) = 3 chunks
    const text = "a b c d e f g h i j";
    const chunks = chunkText(text, 4, 0);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toBe("a b c d");
    expect(chunks[1]).toBe("e f g h");
    expect(chunks[2]).toBe("i j");
  });

  it("overlaps adjacent chunks by the specified number of words", () => {
    // 6 words, chunkSize=4, overlap=2 → chunks start at 0, 2, 4
    const text = "a b c d e f";
    const chunks = chunkText(text, 4, 2);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toBe("a b c d");
    expect(chunks[1]).toBe("c d e f"); // shares "c d" with chunk 0
    expect(chunks[2]).toBe("e f");     // shares "e f" with chunk 1
  });

  it("handles empty string", () => {
    expect(chunkText("", 500, 100)).toHaveLength(0);
  });
});
