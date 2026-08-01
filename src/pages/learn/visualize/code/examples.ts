export interface CodeExample {
  id: string;
  title: string;
  category: string;
  language: string;
  code: string;
}

export const CODE_EXAMPLES: CodeExample[] = [
  {
    id: "factorial",
    title: "Recursive factorial",
    category: "Recursion",
    language: "python",
    code: `def factorial(x):
    if x == 1:
        return 1
    return x * factorial(x - 1)


num = 4
print("The factorial of", num, "is", factorial(num))`,
  },
  {
    id: "fibonacci",
    title: "Fibonacci (tree recursion)",
    category: "Recursion",
    language: "python",
    code: `def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)


print(fib(5))`,
  },
  {
    id: "bubble",
    title: "Bubble sort",
    category: "Sorting",
    language: "python",
    code: `arr = [5, 1, 4, 2]
for i in range(len(arr)):
    for j in range(len(arr) - i - 1):
        if arr[j] > arr[j + 1]:
            arr[j], arr[j + 1] = arr[j + 1], arr[j]
print(arr)`,
  },
  {
    id: "binary-search",
    title: "Binary search",
    category: "Searching",
    language: "javascript",
    code: `function binarySearch(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

console.log(binarySearch([1, 3, 5, 7, 9], 7));`,
  },
  {
    id: "closure",
    title: "Closures & counters",
    category: "JavaScript",
    language: "javascript",
    code: `function makeCounter() {
  let count = 0;
  return function () {
    count += 1;
    return count;
  };
}

const next = makeCounter();
console.log(next());
console.log(next());`,
  },
  {
    id: "linked-list",
    title: "Reverse a linked list",
    category: "Data structures",
    language: "python",
    code: `class Node:
    def __init__(self, val, nxt=None):
        self.val = val
        self.next = nxt


def reverse(head):
    prev = None
    while head:
        nxt = head.next
        head.next = prev
        prev = head
        head = nxt
    return prev


head = Node(1, Node(2, Node(3)))
node = reverse(head)
while node:
    print(node.val)
    node = node.next`,
  },
  {
    id: "two-sum",
    title: "Two sum with a hash map",
    category: "Hashing",
    language: "java",
    code: `import java.util.HashMap;

public class Main {
    public static void main(String[] args) {
        int[] nums = {2, 7, 11, 15};
        int target = 9;
        HashMap<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (seen.containsKey(need)) {
                System.out.println(seen.get(need) + "," + i);
                return;
            }
            seen.put(nums[i], i);
        }
    }
}`,
  },
  {
    id: "hanoi",
    title: "Towers of Hanoi",
    category: "Recursion",
    language: "c++",
    code: `#include <iostream>
using namespace std;

void hanoi(int n, char from, char to, char aux) {
    if (n == 1) {
        cout << "Move 1 from " << from << " to " << to << endl;
        return;
    }
    hanoi(n - 1, from, aux, to);
    cout << "Move " << n << " from " << from << " to " << to << endl;
    hanoi(n - 1, aux, to, from);
}

int main() {
    hanoi(3, 'A', 'C', 'B');
}`,
  },
];
