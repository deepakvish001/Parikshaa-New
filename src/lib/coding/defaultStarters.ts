// Generic per-language starter templates.
// Used as a fallback when a problem in the DB is missing starter code for a
// given language, so the Monaco editor never opens empty.
import type { LangId } from "@/data/codingProblemsData";

const TEMPLATES: Record<string, string> = {
  python: `# Write your solution here
class Solution:
    def solve(self, *args, **kwargs):
        # TODO: implement
        pass


if __name__ == "__main__":
    pass
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    // TODO: implement
};

int main() {
    return 0;
}
`,
  java: `import java.util.*;

public class Main {
    static class Solution {
        // TODO: implement
    }

    public static void main(String[] args) {
        // read input, call Solution
    }
}
`,
  javascript: `// Write your solution here
function solve() {
    // TODO: implement
}

// Example driver
// console.log(solve());
`,
  typescript: `// Write your solution here
function solve(): void {
    // TODO: implement
}

// Example driver
// console.log(solve());
`,
  c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* TODO: implement */

int main(void) {
    return 0;
}
`,
  go: `package main

import "fmt"

func solve() {
    // TODO: implement
}

func main() {
    _ = fmt.Sprint
    solve()
}
`,
};

export const getDefaultStarter = (lang: LangId): string =>
  TEMPLATES[lang] ?? `// Write your ${lang} solution here\n`;
