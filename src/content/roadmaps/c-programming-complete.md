# C Programming — Complete Sheet (Zero to Hero)

Absolute Beginner → Confident C Programmer · Theory + Coding + Projects.

Kiske liye: jisko bilkul kuch nahi aata. Ye sheet C ko zero se sikhaati hai — har module mein **Theory** (concept samjho), **Must-Code** (haath se likho), aur **Gotchas** (common galtiyan). End mein Projects taaki sab apply kar sako.

> **Philosophy — "Derive karo, ratta mat maaro":** syntax ratne se kuch nahi hoga. Har concept ka *kyun* samjho — "yeh loop kyun chahiye", "pointer memory mein kya karta hai". Roz code likho — programming padh ke nahi, likh ke aati hai.

> **Ek rule:** har module ka Must-Code khud type karke, compile karke, run karo. Copy-paste mat karo. Errors aayenge — wahi seekhne ka asli tareeka hai.

> **C kyun?** C poori computer science ki neev hai — memory, pointers, aur "computer andar se kaise chalta hai" C sikhaata hai jo Python/Java chhupa lete hain. C aa gaya to koi bhi language easy lagegi. GATE ke liye bhi C zaroori hai.


## The Journey — 13 Modules

> SETUP → Basics → Control Flow → Loops → Functions → Arrays → Strings → Pointers ⭐ → Memory → Structures → File Handling → Advanced C → PROJECTS. Timeline: ~6-8 weeks consistent (roz 1.5-2 hrs). Module 7 (Pointers) sabse important — waha ruk ke pakka karo.

| # | Name | Description |
| --- | --- | --- |
| 0 | Introduction & Setup | GCC install, compilation model, first "Hello, World!". |
| 1 | Variables, Data Types & I/O | int/float/char, printf/scanf, operators, type casting. |
| 2 | Control Flow | if / else-if / switch / ternary — decisions. |
| 3 | Loops | while / for / do-while, break/continue, pattern printing. |
| 4 | Functions | Reusable blocks, scope, pass-by-value, recursion. |
| 5 | Arrays | 1D & 2D arrays, traversal, matrix ops, sorting intro. |
| 6 | Strings | Char arrays, `\0`, string.h functions. |
| 7 | Pointers ⭐ | Heart of C — `&`, `*`, pass-by-reference, arithmetic. |
| 8 | Dynamic Memory | malloc / calloc / realloc / free, heap vs stack. |
| 9 | Structures, Unions & Enums | Bundle types, model real-world entities, typedef. |
| 10 | File Handling | FILE*, fopen/fclose, fprintf/fscanf, persistence. |
| 11 | Advanced C | Preprocessor, macros, bitwise, function pointers, CLI args. |
| 12 | Projects 🚀 | Beginner → Intermediate → Advanced — apply everything. |


## Module 0 — Introduction & Setup

> Program kya hai, C kaise chalta hai (Preprocess → Compile → Assemble → Link), aur first program. Python interpreted hai, C compiled — isliye tez.

| Part | Name | Description |
| --- | --- | --- |
| Theory | Compilation model | .c → preprocess → compile → assemble → link → binary. |
| Theory | C program structure | `#include`, `int main()`, statements with `;`, `return 0`. |
| Must-Code | Setup GCC | Windows MinGW / Linux `apt install gcc` / Mac Xcode tools. |
| Must-Code | Hello World | `gcc hello.c -o hello && ./hello`. |
| Must-Code | Print bio | Naam, age, ek line — apna program. |
| Gotcha | Missing `;` | Sabse common beginner error. |
| Gotcha | Bhoole `#include <stdio.h>` | `printf` kaam nahi karega. |


## Module 1 — Variables, Data Types & I/O

> Variable = memory ka named box. Types decide karte hain kitni memory aur kya store. `scanf` mein `&` bhoolna = crash.

| Part | Name | Description |
| --- | --- | --- |
| Theory | Data types | int(4), float(4), double(8), char(1) with `%d %f %lf %c`. |
| Theory | Constants | `const float PI = 3.14;` — value fix. |
| Theory | I/O | `printf` output, `scanf("%d", &x)` input. |
| Theory | Operators | Arithmetic, relational, logical, `++/--`, type cast. |
| Must-Code | Arithmetic ops | 2 numbers → sum/diff/prod/quot/rem. |
| Must-Code | Converters | Celsius↔Fahrenheit, Simple Interest, area/perimeter. |
| Must-Code | Swap numbers | With & without third variable. |
| Must-Code | ASCII | Character ka ASCII value print. |
| Gotcha | Integer division | `5/2 = 2` — cast to float for 2.5. |
| Gotcha | Format mismatch | `%d` vs `%f` mismatch = garbage output. |


## Module 2 — Control Flow (Decisions)

> `if` / `else-if` / `switch` / ternary — condition-based branching. `=` vs `==` sabse bada beginner bug.

| Part | Name | Description |
| --- | --- | --- |
| Theory | if / else-if | Ladder of conditions with grade / adult example. |
| Theory | switch-case | Multi-branch on one value; `break` zaroori. |
| Theory | Ternary | `int max = (a > b) ? a : b;`. |
| Must-Code | Basics | Even/odd, positive/negative, largest of 3, leap year. |
| Must-Code | Grade calc | Marks → grade (A/B/C/F). |
| Must-Code | Calculator | `switch` based +, -, *, /. |
| Must-Code | Vowel check | Character vowel/consonant, quadrant of (x,y). |
| Gotcha | `=` vs `==` | Assignment vs comparison — silent bug. |
| Gotcha | Missing `break` | Fall-through executes agle cases. |


## Module 3 — Loops (Repetition)

> `while` / `for` / `do-while`, `break`/`continue`, nested loops for patterns. Infinite loops & off-by-one common bugs.

| Part | Name | Description |
| --- | --- | --- |
| Theory | Loop types | `while`, `for(init;cond;update)`, `do-while` (min 1x). |
| Theory | break / continue | Loop tod / iteration skip. |
| Theory | Nested loops | Outer=rows, inner=cols — pattern base. |
| Must-Code | Number ops | 1..N, N..1, sum, factorial, table, Fibonacci. |
| Must-Code | Digit ops | Reverse, count digits, sum of digits. |
| Must-Code | Number checks | Prime, palindrome, Armstrong. |
| Must-Code | Patterns | Right triangle, pyramid, Floyd's, Pascal's. |
| Must-Code | GCD / LCM | Two numbers. |
| Gotcha | Infinite loop | `i++` update bhoolna. |
| Gotcha | Off-by-one | `i <= n` vs `i < n`. |


## Module 4 — Functions

> Reusable blocks — declare, define, call. Recursion = DSA foundation. Base case bhoolna = stack overflow.

| Part | Name | Description |
| --- | --- | --- |
| Theory | Structure | Declaration (prototype), definition, call. |
| Theory | Scope | Local vs global; pass-by-value default. |
| Theory | Recursion | Base case + recursive call. |
| Theory | Storage classes | auto, static, extern, register. |
| Must-Code | Math functions | add/sub/mul/div, prime, factorial (loop + recursion). |
| Must-Code | Max of 3 | Function returning max. |
| Must-Code | Recursion set | Fibonacci, sum of digits, power(a,b), GCD. |
| Must-Code | Tower of Hanoi | Classic recursion. |
| Must-Code | Array to function | Sum of array via function. |
| Gotcha | No base case | Infinite recursion → stack overflow. |
| Gotcha | Return type mismatch | int function must return int. |


## Module 5 — Arrays

> Same-type contiguous elements, 0-indexed. C out-of-bounds nahi rokta — khud dhyan. 2D = matrix.

| Part | Name | Description |
| --- | --- | --- |
| Theory | 1D arrays | Declaration, init, indexing 0..n-1. |
| Theory | 2D arrays | Matrices, rows × columns, nested traversal. |
| Theory | Arrays & functions | Array pass = address (pointer), not copy. |
| Must-Code | Basics | Input/print, sum, average, max, min, second largest. |
| Must-Code | Search & sort | Linear search, reverse, bubble sort. |
| Must-Code | Matrix ops | Input/print, addition, transpose, multiplication. |
| Must-Code | Matrix sums | Row sum, column sum, diagonal sum. |
| Gotcha | Out of bounds | `arr[10]` on size-5 = garbage/crash. |
| Gotcha | Fixed size | Static arrays can't grow — need dynamic memory. |


## Module 6 — Strings

> Character array ending in `\0`. `scanf("%s")` space pe rukta — use `fgets` for full line. `==` strings compare nahi karta.

| Part | Name | Description |
| --- | --- | --- |
| Theory | Null terminator | `\0` batata hai string kahan khatam. |
| Theory | Reading input | `scanf("%s", name)` vs `fgets(name, size, stdin)`. |
| Theory | string.h | `strlen`, `strcpy`, `strcat`, `strcmp`, `strrev`. |
| Must-Code | Basics | Length (with & without strlen), reverse, palindrome. |
| Must-Code | Counting | Vowels, consonants, spaces, words. |
| Must-Code | Case convert | Upper ↔ lower. |
| Must-Code | Concat & compare | With & without strcat/strcmp. |
| Must-Code | Search | Find character / substring, occurrence count. |
| Gotcha | Size + 1 | Array size = chars + 1 for `\0`. |
| Gotcha | `str1 == str2` | Compares addresses — use `strcmp`. |


## Module 7 — Pointers ⭐ (Heart of C)

> Address-storing variables. `&` = address-of, `*` = dereference. Kaagaz pe memory diagram bana ke samjho — rat-na mat.

| Part | Name | Description |
| --- | --- | --- |
| Theory | Basics | `int *p = &x;` → `*p` deta value at address. |
| Theory | Pointer arithmetic | `p++` moves by sizeof(type). |
| Theory | Pointers & arrays | `arr[i] == *(arr + i)`. |
| Theory | Pass-by-reference | Function pointer se original badal sakta hai. |
| Theory | Double pointer | `int **pp` — pointer to pointer. |
| Theory | Special pointers | NULL, dangling, void. |
| Must-Code | Address & value | Print via pointer. |
| Must-Code | Swap by reference | `swap(&x, &y)` actually swaps. |
| Must-Code | Array via pointers | Access, sum, reverse using two pointers. |
| Must-Code | Function pointer | Pointer that points to a function. |
| Gotcha | Uninitialized pointer | Garbage address → crash. Init `NULL`. |
| Gotcha | `*p` vs `p` vs `&p` | Value vs address vs pointer-of-pointer. |


## Module 8 — Dynamic Memory Management

> Heap allocation for runtime-sized data. Har `malloc` ke saath ek `free` — warna memory leak.

| Part | Name | Description |
| --- | --- | --- |
| Theory | Stack vs Heap | Local auto vs manual dynamic. |
| Theory | `malloc(n)` | n bytes, garbage values. |
| Theory | `calloc(num, size)` | Allocated + zero-initialized. |
| Theory | `realloc(ptr, new)` | Resize existing block. |
| Theory | `free(ptr)` | Wapas de — leak roko. |
| Must-Code | Dynamic array | User se size lo, input/print, sum/max. |
| Must-Code | Resize | Grow with `realloc`. |
| Must-Code | 2D allocation | Dynamically allocate matrix. |
| Must-Code | malloc vs calloc | Garbage vs zero demonstration. |
| Gotcha | Memory leak | Missing `free` = wasted memory. |
| Gotcha | Dangling pointer | Use after `free` = undefined behaviour. |
| Gotcha | NULL from malloc | Always check allocation success. |


## Module 9 — Structures, Unions & Enums

> Bundle heterogenous data. `.` for value, `->` for pointer. Union shares memory; enum = named constants.

| Part | Name | Description |
| --- | --- | --- |
| Theory | struct | Group fields under one type — model entities. |
| Theory | struct pointer | `s->field == (*s).field`. |
| Theory | Array of structs | Multiple records e.g. 100 students. |
| Theory | Nested & typedef | struct in struct; `typedef struct .. Student;`. |
| Theory | union | Members share same memory. |
| Theory | enum | Named integer constants. |
| Must-Code | Student record | Input & print. |
| Must-Code | Topper | Array of students, print highest scorer. |
| Must-Code | Struct + function | Pass struct to function. |
| Must-Code | Complex numbers | Addition using struct. |
| Must-Code | Employee DB | Add / display / search. |
| Gotcha | `.` vs `->` | Value vs pointer access. |
| Gotcha | union validity | Only one member valid at a time. |
| Gotcha | Big struct copy | Pass by pointer for efficiency. |


## Module 10 — File Handling

> Permanent data storage. `FILE *fp; fopen; fclose`. Modes: r, w, a, r+, w+.

| Part | Name | Description |
| --- | --- | --- |
| Theory | File pointer | `FILE *fp;` — handle to file. |
| Theory | Modes | r (read), w (overwrite), a (append). |
| Theory | Text I/O | `fprintf` / `fscanf` / `fgets` / `fputs`. |
| Theory | Binary I/O | `fread` / `fwrite` for structs. |
| Must-Code | Write & read | Text file round-trip. |
| Must-Code | Count | Lines / words / characters. |
| Must-Code | Copy / append | Copy file, append data. |
| Must-Code | Struct persistence | Save & load student records. |
| Must-Code | Log file | Timestamped entries. |
| Gotcha | fopen NULL | File na mile — always check. |
| Gotcha | `"w"` overwrites | Purana content mit jaayega. |
| Gotcha | Bhoola fclose | Buffer flush nahi hoga — data loss. |


## Module 11 — Advanced C

> Preprocessor, macros, bitwise, function pointers, CLI args. Macro brackets zaroori.

| Part | Name | Description |
| --- | --- | --- |
| Theory | Preprocessor | `#define`, `#include`, macros — text replace before compile. |
| Theory | Header files | Split code into `.h` + `.c` for modularity. |
| Theory | CLI arguments | `int main(int argc, char *argv[])`. |
| Theory | Bitwise ops | `& \| ^ ~ << >>` — bits pe direct kaam. |
| Theory | Function pointers | Pass functions as arguments (callbacks). |
| Theory | const & volatile | Immutable vs "don't optimize". |
| Must-Code | Macros | area, max, square with proper brackets. |
| Must-Code | Multi-file | Split into `.h` + `.c`, link together. |
| Must-Code | CLI calculator | `./calc 5 + 3`. |
| Must-Code | Bit tricks | Even/odd via `&`, swap via `^`, count set bits. |
| Must-Code | Function pointer | Pass function as argument. |
| Gotcha | Macro brackets | `#define SQ(x) ((x)*(x))`, not `x*x`. |
| Gotcha | `#define` with `;` | Don't — it's text replacement. |
| Gotcha | Multi-file build | `gcc file1.c file2.c -o app`. |


## Module 12 — Projects (Sab Apply Karo)

> Projects se sab concepts jud jaate hain. Har project ek level up. Chhote se shuru, phir bade. Har project ke baad usse improve karo — features add karo, edge cases handle karo.

| Level | Name | Description |
| --- | --- | --- |
| 🟢 Beginner | Calculator (menu-driven) | loops, switch, functions. |
| 🟢 Beginner | Number guessing game | loops, if-else, `rand()`. |
| 🟢 Beginner | Simple quiz app | arrays, loops, scoring. |
| 🟢 Beginner | Unit converter | functions, I/O. |
| 🟢 Beginner | Times table generator | nested loops. |
| 🟢 Beginner | BMI calculator | float math, conditions. |
| 🟡 Intermediate | Student Management System | structures, arrays, functions. |
| 🟡 Intermediate | Tic-Tac-Toe | 2D arrays, game logic. |
| 🟡 Intermediate | Simple Banking System | structures, menu, validation. |
| 🟡 Intermediate | Contact Book | array of structs, search. |
| 🟡 Intermediate | Matrix Calculator | 2D arrays, operations. |
| 🟡 Intermediate | Text-based Hangman | strings, arrays. |
| 🔴 Advanced | Library Management System | structs + file handling. |
| 🔴 Advanced | Student DB with file storage | fread/fwrite, CRUD. |
| 🔴 Advanced | Inventory / Shop Management | files, structs, reports. |
| 🔴 Advanced | Basic Text Editor | file I/O, string manipulation. |
| 🔴 Advanced | Snake Game (console) | 2D arrays, pointers, real-time input. |
| 🔴 Advanced | Mini DSA implementations | linked list, stack, queue with pointers + malloc. |


## Study Plan (6-8 Weeks)

> Realistic schedule. Week 4 (Pointers) pe ruko — bina rush ke pakka karo.

| Week | Modules | Focus |
| --- | --- | --- |
| 1 | 0, 1, 2 | Setup + basics + decisions. |
| 2 | 3, 4 | Loops + patterns + functions + recursion. |
| 3 | 5, 6 | Arrays + strings + 1 beginner project. |
| 4 | 7 ⭐ | Pointers (ruk ke pakka karo). |
| 5 | 8, 9 | Memory + structures + 1 intermediate project. |
| 6 | 10, 11 | Files + advanced C. |
| 7-8 | 12 | Projects + revision + weak areas. |


## C Mastery Checklist

> Sab tick? Ab tum C-ready ho. Next stop → Problem Solving Foundation, phir DSA.

| ☆ | Name | Description |
| --- | --- | --- |
| ☐ | GCC comfortable | Compile & run bina soche kar sako. |
| ☐ | Control flow | if-else, loops, switch — muscle memory. |
| ☐ | Functions & recursion | Samajh + likh sakte ho. |
| ☐ | Arrays 1D & 2D | Traversal, matrix ops. |
| ☐ | Strings | string.h functions comfortable. |
| ☐ | Pointers ⭐ | Memory diagram bana ke samjha sakte ho. |
| ☐ | Dynamic memory | malloc/free properly use kar sakte ho. |
| ☐ | Structures | Real-world entities model kar sakte ho. |
| ☐ | File handling | Data save/load kar sakte ho. |
| ☐ | Projects | Kam se kam 3 banaye (1 har level). |
| ☐ | Debugging | Segfault, memory leak fix kar sakte ho. |


## Closing Note

> C mein errors bahut aayenge — segmentation fault, garbage values, crashes. Frustrate mat ho — har error ek lesson hai. C debug karna seekh gaye, to programming ka 50% aa gaya.

| ☆ | Name | Description |
| --- | --- | --- |
| 💪 | Roz code likho | Padhne se nahi, likhne se aati hai. Derive karo, ratta mat maaro. |
